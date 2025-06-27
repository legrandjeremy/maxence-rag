import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UserProgressService } from '../../lib/UserProgressService';
import { validateToken, hasPermission } from '../../lib/auth';
import { createResponse } from '../../lib/common';

const userProgressService = new UserProgressService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Validate Auth0 token
    const tokenPayload = await validateToken(event);
    if (!tokenPayload) {
      return createResponse(401, { error: 'Unauthorized' });
    }

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const progressData = JSON.parse(event.body);
    
    // Validate required fields
    if (!progressData.userId || !progressData.lessonId || progressData.pointsEarned === undefined) {
      return createResponse(400, { 
        error: 'Missing required fields: userId, lessonId, pointsEarned' 
      });
    }

    // Users can only update their own progress, unless they're admin/team manager
    const currentUserId = tokenPayload.sub;
    if (progressData.userId !== currentUserId && 
        !hasPermission(tokenPayload, 'update:user-progress')) {
      return createResponse(403, { error: 'Can only update your own progress' });
    }

    const progress = await userProgressService.updateProgress(
      progressData.userId,
      progressData.lessonId,
      progressData.pointsEarned,
      progressData.campaignId
    );
    
    return createResponse(200, { progress });
  } catch (error) {
    console.error('Error updating progress:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}; 