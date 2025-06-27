import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { userService } from '../../lib/common';
import { extractAuth0User, checkAdminPermission, checkTeamManagerPermission } from '../../lib/auth';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
  };

  try {
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      };
    }

    // Extract and validate user
    const authResult = extractAuth0User(event);
    if (!authResult.success || !authResult.user) {
      return {
        statusCode: authResult.statusCode || 401,
        headers,
        body: JSON.stringify({ error: authResult.error })
      };
    }

    const auth0User = authResult.user;

    // Check permissions
    if (!checkTeamManagerPermission(auth0User)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions. Team manager or admin access required.' })
      };
    }

    // Get query parameters
    const companyId = event.queryStringParameters?.companyId;
    const teamManagerId = event.queryStringParameters?.teamManagerId;

    let users;

    if (checkAdminPermission(auth0User)) {
      // Admin can see all users or filter by company/team manager
      if (companyId) {
        users = await userService.getUsersByCompany(companyId);
      } else if (teamManagerId) {
        users = await userService.getUsersByTeamManager(teamManagerId);
      } else {
        // For admin, we'd need to implement a scan or use a different approach
        // For now, require companyId parameter for admins
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Admin users must specify companyId parameter to list users' 
          })
        };
      }
    } else {
      // Team managers can only see their own team members
      // First, get the team manager's user record to find their ID
      const teamManagerUser = await userService.getUserByEmail(auth0User.email);
      if (!teamManagerUser) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Team manager user not found' })
        };
      }

      users = await userService.getUsersByTeamManager(teamManagerUser.id);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(users)
    };

  } catch (error) {
    console.error('Error getting users:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}; 