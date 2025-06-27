import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { teamService, createResponse } from '../../lib/common';
import { extractAuth0User, checkAdminPermission, checkTeamManagerPermission } from '../../lib/auth';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Verify authorization
    const authResult = extractAuth0User(event);
    if (!authResult.success || !authResult.user) {
      return createResponse(401, { error: 'Unauthorized' });
    }

    // Check permissions - admin or team manager
    const isAdmin = checkAdminPermission(authResult.user);
    const isTeamManager = checkTeamManagerPermission(authResult.user);

    if (!isAdmin && !isTeamManager) {
      return createResponse(403, { error: 'Insufficient permissions' });
    }

    const queryParams = event.queryStringParameters || {};
    const companyId = queryParams.companyId;
    const managerId = queryParams.managerId;

    let teams;

    if (managerId && (isAdmin || authResult.user.sub === managerId)) {
      // Get teams managed by a specific user
      teams = await teamService.getTeamsByManager(managerId);
    } else if (companyId && isAdmin) {
      // Get teams by company (admin only)
      teams = await teamService.getTeamsByCompany(companyId);
    } else if (isTeamManager && !isAdmin) {
      // Team managers can only see their own teams
      teams = await teamService.getTeamsByManager(authResult.user.sub);
    } else {
      return createResponse(400, { 
        error: 'Either companyId (admin only) or managerId parameter is required' 
      });
    }

    return createResponse(200, teams);

  } catch (error) {
    console.error('Error getting teams:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}; 