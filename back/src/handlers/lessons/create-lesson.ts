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

    // Check if user has admin permissions
    if (!hasPermission(tokenPayload, 'maijin-defi-challenge:admin')) {
      return createResponse(403, { error: 'Insufficient permissions' });
    }

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const lessonData = JSON.parse(event.body);
    
    // Validate required fields
    if (!lessonData.campaignId || !lessonData.title) {
      return createResponse(400, { 
        error: 'Missing required fields: campaignId, title' 
      });
    }

    // Map frontend fields to backend fields
    const lessonRequest = {
      campaignId: lessonData.campaignId,
      name: lessonData.title, // Frontend sends 'title', backend expects 'name'
      description: lessonData.description,
      points: lessonData.maxPoints || 100, // Frontend sends 'maxPoints', backend expects 'points'
      order: lessonData.order || 1
    };

    const createdBy = tokenPayload.sub || 'unknown';
    const backendLesson = await lessonService.createLesson(lessonRequest, createdBy);
    
    // Map backend lesson format to frontend format
    const lesson = {
      id: backendLesson.id,
      title: backendLesson.name, // Backend 'name' -> Frontend 'title'
      description: backendLesson.description,
      campaignId: backendLesson.campaignId,
      order: backendLesson.order,
      maxPoints: backendLesson.points, // Backend 'points' -> Frontend 'maxPoints'
      content: '', // Backend doesn't have content field yet, set to empty string
      createdAt: backendLesson.createdAt,
      updatedAt: backendLesson.updatedAt,
      createdBy: backendLesson.createdBy
    };
    
    return createResponse(201, { lesson });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}; 