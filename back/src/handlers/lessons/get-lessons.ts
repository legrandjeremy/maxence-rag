import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { validateToken, hasPermission } from '../../lib/auth';
import { createResponse, lessonService } from '../../lib/common';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Validate Auth0 token
    const tokenPayload = await validateToken(event);
    if (!tokenPayload) {
      return createResponse(401, { error: 'Unauthorized' });
    }

    const { campaignId } = event.queryStringParameters || {};

    if (!campaignId) {
      return createResponse(400, { error: 'campaignId is required' });
    }

    // Check permissions - all authenticated users can read lessons
    if (!hasPermission(tokenPayload, 'maijin-defi-challenge:admin')) {
      return createResponse(403, { error: 'Insufficient permissions' });
    }

    const backendLessons = await lessonService.getLessonsByCampaign(campaignId);
    
    // Map backend lesson format to frontend format
    const lessons = backendLessons.map(lesson => ({
      id: lesson.id,
      title: lesson.name, // Backend 'name' -> Frontend 'title'
      description: lesson.description,
      campaignId: lesson.campaignId,
      order: lesson.order,
      maxPoints: lesson.points, // Backend 'points' -> Frontend 'maxPoints'
      content: '', // Backend doesn't have content field yet, set to empty string
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      createdBy: lesson.createdBy
    }));
    
    return createResponse(200, { lessons });
  } catch (error) {
    console.error('Error getting lessons:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}; 