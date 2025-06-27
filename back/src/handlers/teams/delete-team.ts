import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { teamService, createResponse } from '../../lib/common';
import { extractAuth0User, checkAdminPermission } from '../../lib/auth';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Verify authorization
    const authResult = extractAuth0User(event);
    if (!authResult.success || !authResult.user) {
      return createResponse(401, { error: 'Unauthorized' });
    }

    // Check admin permissions
    if (!checkAdminPermission(authResult.user)) {
      return createResponse(403, { error: 'Insufficient permissions' });
    }

    // Get team ID from path parameters
    const teamId = event.pathParameters?.id;
    if (!teamId) {
      return createResponse(400, { error: 'Team ID is required' });
    }

    // Check if team exists
    const existingTeam = await teamService.getTeamById(teamId);
    if (!existingTeam) {
      return createResponse(404, { error: 'Team not found' });
    }

    // Delete team (this will also remove all team members)
    await teamService.deleteTeam(teamId);

    return createResponse(200, { message: 'Team deleted successfully' });

  } catch (error) {
    console.error('Error deleting team:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}; 