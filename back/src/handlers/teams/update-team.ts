import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { teamService, createResponse } from '../../lib/common';
import { TeamUpdateRequest } from '../../models/Team';
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

    // Parse request body
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const request: TeamUpdateRequest = JSON.parse(event.body);

    // Validate fields if provided
    if (request.name !== undefined && !request.name.trim()) {
      return createResponse(400, { error: 'Team name cannot be empty' });
    }

    // Check if team exists
    const existingTeam = await teamService.getTeamById(teamId);
    if (!existingTeam) {
      return createResponse(404, { error: 'Team not found' });
    }

    // Update team
    const updatedTeam = await teamService.updateTeam(teamId, request);

    return createResponse(200, updatedTeam);

  } catch (error) {
    console.error('Error updating team:', error);
    
    if (error instanceof SyntaxError) {
      return createResponse(400, { error: 'Invalid JSON in request body' });
    }

    return createResponse(500, { error: 'Internal server error' });
  }
}; 