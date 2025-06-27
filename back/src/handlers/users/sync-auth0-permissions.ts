import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { userService } from '../../lib/common';
import { extractAuth0User, checkAdminPermission, syncAuth0UserPermissions } from '../../lib/auth';

interface Auth0User {
  sub: string;
  email: string;
  scope: string;
}

interface SyncResult {
  userId: string;
  email: string;
  userType: string;
  auth0UserId: string;
  syncSuccess: boolean;
  error?: string;
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

    // Check admin permissions - only admins can sync permissions
    if (!checkAdminPermission(auth0User)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions. Admin access required.' })
      };
    }

    console.log('Starting Auth0 permissions sync for all users...');

    // Get all users from the database
    // Note: This is a simplified approach. In production, you might want to implement pagination
    const allUsers = await userService.getAllUsers();
    
    if (!allUsers || allUsers.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'No users found to sync',
          results: []
        })
      };
    }

    const syncResults: SyncResult[] = [];

    // Process each user
    for (const user of allUsers) {
      const syncResult: SyncResult = {
        userId: user.id,
        email: user.email,
        userType: user.userType,
        auth0UserId: user.auth0UserId,
        syncSuccess: false
      };

      try {
        // Skip users without valid Auth0 IDs
        if (!user.auth0UserId || user.auth0UserId === 'pending-auth0-sync') {
          syncResult.error = 'No valid Auth0 user ID';
          syncResults.push(syncResult);
          continue;
        }

        // Sync permissions with Auth0
        const auth0SyncResult = await syncAuth0UserPermissions(
          user.auth0UserId,
          user.userType
        );

        syncResult.syncSuccess = auth0SyncResult.success;
        if (!auth0SyncResult.success) {
          syncResult.error = auth0SyncResult.error;
        }

        console.log(`Sync result for user ${user.email}:`, auth0SyncResult);

      } catch (error) {
        syncResult.error = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error syncing user ${user.email}:`, error);
      }

      syncResults.push(syncResult);
    }

    // Prepare summary
    const successCount = syncResults.filter(r => r.syncSuccess).length;
    const failureCount = syncResults.filter(r => !r.syncSuccess).length;

    const response = {
      message: `Auth0 permissions sync completed`,
      summary: {
        totalUsers: syncResults.length,
        successful: successCount,
        failed: failureCount
      },
      results: syncResults
    };

    console.log('Auth0 sync summary:', response.summary);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error during Auth0 permissions sync:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error during sync',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}; 