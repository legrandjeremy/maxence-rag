import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { companyService, userService, createResponse } from '../../lib/common';
import { extractAuth0User, checkAdminPermission, checkTeamManagerPermission } from '../../lib/auth';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Extract and validate user
    const authResult = extractAuth0User(event);
    if (!authResult.success || !authResult.user) {
      return createResponse(401, { error: 'Unauthorized' });
    }

    // Check permissions
    const isAdmin = checkAdminPermission(authResult.user);
    const isTeamManager = checkTeamManagerPermission(authResult.user);

    if (!isAdmin && !isTeamManager) {
      return createResponse(403, { error: 'Insufficient permissions' });
    }

    let companies;

    if (isAdmin) {
      // Admin can see all companies
      companies = await companyService.getAllCompanies();
    } else {
      // Team manager can only see companies where they manage teams
      // First, get the current user's internal ID
      let currentUser = null;
      
      // Try to find user by email
      currentUser = await userService.getUserByEmail(authResult.user['https//defi.maijin/email']);

      if (!currentUser) {
        return createResponse(404, { error: 'User not found in system' });
      }

      companies = await companyService.getCompaniesByTeamManager(currentUser.id);
    }

    return createResponse(200, companies);

  } catch (error) {
    console.error('Error getting companies:', error);
    return createResponse(500, { 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 