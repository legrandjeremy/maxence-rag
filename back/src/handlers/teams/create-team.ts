import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { teamService, createResponse } from '../../lib/common';
import { TeamCreateRequest } from '../../models/Team';
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

    // Parse request body
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const request: TeamCreateRequest = JSON.parse(event.body);

    // Validate required fields
    if (!request.name?.trim()) {
      return createResponse(400, { error: 'Team name is required' });
    }

    if (!request.companyId?.trim()) {
      return createResponse(400, { error: 'Company ID is required' });
    }

    // Create team
    const team = await teamService.createTeam(request, authResult.user.sub);

    return createResponse(201, team);

  } catch (error) {
    console.error('Error creating team:', error);
    
    if (error instanceof SyntaxError) {
      return createResponse(400, { error: 'Invalid JSON in request body' });
    }

    return createResponse(500, { error: 'Internal server error' });
  }
}; 