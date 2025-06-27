import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { userService } from '../../lib/common';
import { extractAuth0User, checkAdminPermission } from '../../lib/auth';

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
    'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
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

    // Check if user exists
    const existingUser = await userService.getUserById(userId);
    if (!existingUser) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Check if trying to delete self
    if (existingUser.auth0UserId === auth0User.sub) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Cannot delete your own account' })
      };
    }

    // Check query parameter for soft vs hard delete
    const hardDelete = event.queryStringParameters?.hard === 'true';

    if (hardDelete) {
      // Hard delete - completely remove from database
      await userService.deleteUser(userId);
    } else {
      // Soft delete - set isActive to false
      await userService.updateUser(userId, { isActive: false });
    }

    return {
      statusCode: 204,
      headers,
      body: ''
    };

  } catch (error) {
    console.error('Error deleting user:', error);
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