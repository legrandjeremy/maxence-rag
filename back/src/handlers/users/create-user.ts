import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { userService } from '../../lib/common';
import { UserCreateRequest } from '../../models/User';
import { extractAuth0User, checkAdminPermission, createOrUpdateAuth0UserWithPermissions } from '../../lib/auth';

interface Auth0User {
  sub: string;
  email: string;
  scope: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
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

    // Check admin permissions for user management
    if (!checkAdminPermission(auth0User)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions. Admin access required.' })
      };
    }

    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const request: UserCreateRequest = JSON.parse(event.body);

    // Validate required fields
    if (!request.email || !request.firstName || !request.lastName || !request.userType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: email, firstName, lastName, userType' 
        })
      };
    }

    // Validate userType
    if (!['admin', 'team_manager', 'user'].includes(request.userType)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid userType. Must be admin, team_manager, or user' 
        })
      };
    }

    // Check if user already exists in our database
    const existingUser = await userService.getUserByEmail(request.email);
    if (existingUser) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'User with this email already exists in our system' })
      };
    }

    // Create or update user in Auth0 and sync permissions
    const auth0Result = await createOrUpdateAuth0UserWithPermissions(
      request.email,
      request.firstName,
      request.lastName,
      request.userType
    );

    if (!auth0Result.success) {
      console.error('Failed to create/update Auth0 user:', auth0Result.error);
      // Continue with local user creation but log the Auth0 sync failure
      // In production, you might want to make this a hard failure
    }

    // Create user in local database
    const auth0UserId = auth0Result.auth0UserId || 'pending-auth0-sync';
    const createdUser = await userService.createUser(
      request,
      auth0UserId,
      auth0User.sub  // Created by current user
    );

    // Return success response with both local and Auth0 sync status
    const responseBody = {
      ...createdUser,
      auth0Sync: {
        success: auth0Result.success,
        error: auth0Result.error
      }
    };

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(responseBody)
    };

  } catch (error) {
    console.error('Error creating user:', error);
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