import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { teamService, userService, createResponse } from '../../lib/common';
import { extractAuth0User, checkTeamManagerPermission } from '../../lib/auth';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Verify authorization
    const authResult = extractAuth0User(event);
    if (!authResult.success || !authResult.user) {
      return createResponse(401, { error: 'Unauthorized' });
    }

    // Check permissions - team manager or admin
    if (!checkTeamManagerPermission(authResult.user)) {
      return createResponse(403, { 
        error: 'Insufficient permissions. Team manager access required.' 
      });
    }

    console.log('authResult.user', authResult.user)

    // First, get the internal user ID from Auth0 ID or email
    let currentUser = null;
    
    // Try to find user by Auth0 ID first
    currentUser = await userService.getUserByEmail(authResult.user['https//defi.maijin/email']);

    if (!currentUser) {
      return createResponse(404, { error: 'User not found in system' });
    }

    console.log('currentUser 2', currentUser)

    // Get teams managed by the current user using their internal ID
    const managedTeams = await teamService.getTeamsByManager(currentUser.id);

    return createResponse(200, managedTeams);

  } catch (error) {
    console.error('Error getting managed teams:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}; 