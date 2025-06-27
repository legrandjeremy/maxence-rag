import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { userProgressService, userService, lessonService, createResponse } from '../../lib/common';
import { extractAuth0User, checkAdminPermission, checkTeamManagerPermission } from '../../lib/auth';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Verify authorization
    const authResult = extractAuth0User(event);
    if (!authResult.success || !authResult.user) {
      return createResponse(401, { error: 'Unauthorized' });
    }

    // Check team manager permissions
    const isAdmin = checkAdminPermission(authResult.user);
    const isTeamManager = checkTeamManagerPermission(authResult.user);

    if (!isAdmin && !isTeamManager) {
      return createResponse(403, { error: 'Insufficient permissions' });
    }

    // Get parameters
    const userId = event.pathParameters?.userId;
    const campaignId = event.queryStringParameters?.campaignId;

    if (!userId) {
      return createResponse(400, { error: 'User ID is required' });
    }

    if (!campaignId) {
      return createResponse(400, { error: 'Campaign ID is required' });
    }

    // Get the current user's internal ID for authorization
    let currentUser = null;
    
    // Try to find user by email
    currentUser = await userService.getUserByEmail(authResult.user['https//defi.maijin/email']);

    if (!currentUser) {
      return createResponse(404, { error: 'User not found in system' });
    }

    // Get user details
    const targetUser = await userService.getUserById(userId);
    if (!targetUser) {
      return createResponse(404, { error: 'Target user not found' });
    }

    // Get detailed user progress for the campaign
    const userProgressList = await userProgressService.getUserProgressByCampaign(userId, campaignId);

    // Get lesson details for each progress record
    const detailedProgress = await Promise.all(
      userProgressList.map(async (progress) => {
        const lesson = await lessonService.getLessonById(progress.lessonId);
        return {
          id: progress.id,
          lessonId: progress.lessonId,
          lessonTitle: lesson?.title || 'Unknown Lesson',
          lessonName: lesson?.name || 'Unknown Lesson',
          pointsEarned: progress.pointsEarned,
          maxPoints: progress.maxPoints,
          completedAt: progress.completedAt,
          assignedBy: progress.assignedBy,
          notes: progress.notes,
          createdAt: progress.createdAt,
          updatedAt: progress.updatedAt
        };
      })
    );

    // Calculate summary stats
    const totalPoints = userProgressList.reduce((sum, progress) => sum + progress.pointsEarned, 0);
    const totalMaxPoints = userProgressList.reduce((sum, progress) => sum + progress.maxPoints, 0);
    const completedLessons = userProgressList.length;

    const response = {
      userId: targetUser.id,
      userEmail: targetUser.email,
      userFirstName: targetUser.firstName,
      userLastName: targetUser.lastName,
      campaignId,
      summary: {
        totalPoints,
        totalMaxPoints,
        completedLessons,
        averageScore: totalMaxPoints > 0 ? (totalPoints / totalMaxPoints) * 100 : 0
      },
      progressDetails: detailedProgress
    };

    return createResponse(200, response);

  } catch (error) {
    console.error('Error getting user progress details:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}; 