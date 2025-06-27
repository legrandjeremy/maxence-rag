import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  userService, 
  campaignService, 
  lessonService, 
  userProgressService,
  documentService 
} from '../../lib/common';
import { extractAuth0User, checkUserPermission } from '../../lib/auth';

interface UserDashboardData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  campaigns: Array<{
    id: string;
    name: string;
    description?: string;
    totalPoints: number;
    earnedPoints: number;
    completedLessons: number;
    totalLessons: number;
    progress: number;
    lessons: Array<{
      id: string;
      name: string;
      description?: string;
      points: number;
      order: number;
      completed: boolean;
      earnedPoints: number;
      documents: Array<{
        id: string;
        name: string;
        fileName: string;
        order: number;
      }>;
    }>;
    documents: Array<{
      id: string;
      name: string;
      fileName: string;
      order: number;
    }>;
  }>;
  totalPoints: number;
  rank?: number;
  totalUsers?: number;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
  };

  try {
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      };
    }

    // Extract and validate user
    const authResult = extractAuth0User(event);
    if (!authResult.success || !authResult.user) {
      return {
        statusCode: authResult.statusCode || 401,
        headers,
        body: JSON.stringify({ error: authResult.error })
      };
    }

    const auth0User = authResult.user;

    // Check permissions
    if (!checkUserPermission(auth0User)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions.' })
      };
    }

    // Get user from database
    const user = await userService.getUserByEmail(auth0User['https//defi.maijin/email']);
    if (!user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found', auth0User })
      };
    }

    // Get user's company campaigns
    if (!user.companyId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User is not assigned to a company' })
      };
    }

    const campaigns = await campaignService.getActiveCampaignsByCompany(user.companyId);
    
    const dashboardData: UserDashboardData = {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      },
      campaigns: [],
      totalPoints: 0
    };

    // Process each campaign
    for (const campaign of campaigns) {
      const lessons = await lessonService.getActiveLessonsByCampaign(campaign.id);
      const userProgress = await userProgressService.getUserProgressByCampaign(user.id, campaign.id);
      const campaignDocuments = await documentService.getActiveDocumentsByCampaign(campaign.id);

      let campaignEarnedPoints = 0;
      let campaignTotalPoints = 0;
      let completedLessons = 0;

      const processedLessons = await Promise.all(lessons.map(async (lesson) => {
        const progress = userProgress.find(p => p.lessonId === lesson.id);
        const lessonDocuments = await documentService.getActiveDocumentsByLesson(lesson.id);
        
        campaignTotalPoints += lesson.points;
        
        if (progress) {
          campaignEarnedPoints += progress.pointsEarned;
          completedLessons++;
        }

        return {
          id: lesson.id,
          name: lesson.name,
          description: lesson.description,
          points: lesson.points,
          order: lesson.order,
          completed: !!progress,
          earnedPoints: progress?.pointsEarned || 0,
          documents: lessonDocuments.map(doc => ({
            id: doc.id,
            name: doc.name,
            fileName: doc.fileName,
            order: doc.order
          }))
        };
      }));

      dashboardData.campaigns.push({
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        totalPoints: campaignTotalPoints,
        earnedPoints: campaignEarnedPoints,
        completedLessons,
        totalLessons: lessons.length,
        progress: lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0,
        lessons: processedLessons.sort((a, b) => a.order - b.order),
        documents: campaignDocuments.map(doc => ({
          id: doc.id,
          name: doc.name,
          fileName: doc.fileName,
          order: doc.order
        }))
      });

      dashboardData.totalPoints += campaignEarnedPoints;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(dashboardData)
    };

  } catch (error) {
    console.error('Error getting user dashboard:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}; 