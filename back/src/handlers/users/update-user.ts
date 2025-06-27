import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { userService } from '../../lib/common';
import { UserUpdateRequest } from '../../models/User';
import { extractAuth0User, checkAdminPermission, syncAuth0UserPermissions } from '../../lib/auth';

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
    'Access-Control-Allow-Methods': 'PUT,OPTIONS'
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

    // Get user ID from path parameters
    const userId = event.pathParameters?.id;
    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User ID is required' })
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

    const request: UserUpdateRequest = JSON.parse(event.body);

    // Validate userType if provided
    if (request.userType && !['admin', 'team_manager', 'user'].includes(request.userType)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid userType. Must be admin, team_manager, or user' 
        })
      };
    }

    // Check if user exists
    const existingUser = await userService.getUserById(userId);
    if (!existingUser) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Check if userType is being changed and sync Auth0 permissions
    let auth0SyncResult: { success: boolean; error?: string } | null = null;
    
    if (request.userType && request.userType !== existingUser.userType) {
      if (existingUser.auth0UserId && existingUser.auth0UserId !== 'pending-auth0-sync') {
        auth0SyncResult = await syncAuth0UserPermissions(
          existingUser.auth0UserId,
          request.userType
        );

        if (!auth0SyncResult.success) {
          console.error('Failed to sync Auth0 permissions:', auth0SyncResult.error);
          // Continue with local update but log the Auth0 sync failure
          // In production, you might want to make this a hard failure
        }
      } else {
        console.warn(`User ${userId} has no valid Auth0 ID for permission sync`);
      }
    }

    // Update user in local database
    const updatedUser = await userService.updateUser(userId, request);

    // Return response with Auth0 sync status if applicable
    const responseBody = {
      ...updatedUser,
      ...(auth0SyncResult && {
        auth0Sync: auth0SyncResult
      })
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseBody)
    };

  } catch (error) {
    console.error('Error updating user:', error);
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