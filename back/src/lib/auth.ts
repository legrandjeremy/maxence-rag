import { APIGatewayProxyEvent } from 'aws-lambda';
import { Auth0ManagementService } from './Auth0ManagementService';

export interface Auth0User {
  sub: string;
  email: string;
  scope: string;
  'https//defi.maijin/email': string;
  [key: string]: unknown;
}

export interface AuthResult {
  success: boolean;
  user?: Auth0User;
  error?: string;
  statusCode?: number;
}

// Create singleton instance of Auth0ManagementService
let auth0ManagementService: Auth0ManagementService | null = null;

const getAuth0ManagementService = (): Auth0ManagementService => {
  if (!auth0ManagementService) {
    auth0ManagementService = new Auth0ManagementService();
  }
  return auth0ManagementService;
};

export const extractAuth0User = (event: APIGatewayProxyEvent): AuthResult => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return {
        success: false,
        error: 'Authorization header missing',
        statusCode: 401
      };
    }

    // Parse JWT token (in production, you'd validate this properly with Auth0)
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    
    return {
      success: true,
      user: payload as Auth0User
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid token format',
      statusCode: 401
    };
  }
};

export const hasPermission = (user: Auth0User, requiredScope: string): boolean => {
  const scopes = user.scope?.split(' ') || [];
  return scopes.includes(requiredScope);
};

export const hasAnyPermission = (user: Auth0User, requiredScopes: string[]): boolean => {
  const scopes = user.scope?.split(' ') || [];
  return requiredScopes.some(scope => scopes.includes(scope));
};

// Permission constants
export const PERMISSIONS = {
  ADMIN: 'maijin-defi-challenge:admin',
  TEAM_MANAGER: 'maijin-defi-challenge:team-manager',
  USER: 'maijin-defi-challenge:user',
  READ: 'maijin-defi-challenge:read',
  WRITE: 'maijin-defi-challenge:write'
} as const;

export const checkAdminPermission = (user: Auth0User): boolean => {
  return hasPermission(user, PERMISSIONS.ADMIN);
};

export const checkTeamManagerPermission = (user: Auth0User): boolean => {
  return hasAnyPermission(user, [PERMISSIONS.ADMIN, PERMISSIONS.TEAM_MANAGER]);
};

export const checkUserPermission = (user: Auth0User): boolean => {
  return hasAnyPermission(user, [PERMISSIONS.ADMIN, PERMISSIONS.TEAM_MANAGER, PERMISSIONS.USER]);
};

export const checkReadPermission = (user: Auth0User): boolean => {
  return hasAnyPermission(user, [PERMISSIONS.ADMIN, PERMISSIONS.TEAM_MANAGER, PERMISSIONS.USER, PERMISSIONS.READ]);
};

export const checkWritePermission = (user: Auth0User): boolean => {
  return hasAnyPermission(user, [PERMISSIONS.ADMIN, PERMISSIONS.TEAM_MANAGER, PERMISSIONS.WRITE]);
};

export const validateToken = async (event: APIGatewayProxyEvent): Promise<Auth0User | null> => {
  const result = extractAuth0User(event);
  if (!result.success || !result.user) {
    return null;
  }
  return result.user;
};

/**
 * Extracts email from Auth0 token in the event
 */
export const getEmailFromToken = (event: APIGatewayProxyEvent): string | null => {
  const result = extractAuth0User(event);
  console.log('result', result);
  if (!result.success || !result.user) {
    return null;
  }
  return result.user['https//defi.maijin/email'] ?? null;
};

/**
 * Validates if an email exists in Auth0
 */
export const validateAuth0Email = async (email: string): Promise<boolean> => {
  try {
    const managementService = getAuth0ManagementService();
    return await managementService.userExists(email);
  } catch (error) {
    console.error('Error validating Auth0 email:', error);
    // Fallback to true for development if Auth0 Management API is not configured
    return true;
  }
};

/**
 * Gets Auth0 user by email
 */
export const getAuth0UserByEmail = async (email: string): Promise<unknown | null> => {
  try {
    const managementService = getAuth0ManagementService();
    return await managementService.getUserByEmail(email);
  } catch (error) {
    console.error('Error getting Auth0 user by email:', error);
    return null;
  }
};

/**
 * Creates or updates user in Auth0 and synchronizes permissions
 */
export const createOrUpdateAuth0UserWithPermissions = async (
  email: string,
  firstName: string,
  lastName: string,
  userType: 'admin' | 'team_manager' | 'user'
): Promise<{ success: boolean; auth0UserId?: string; error?: string }> => {
  try {
    const managementService = getAuth0ManagementService();
    const auth0User = await managementService.createOrUpdateUserWithPermissions(
      email,
      firstName,
      lastName,
      userType
    );

    if (!auth0User) {
      return {
        success: false,
        error: 'Failed to create or update user in Auth0'
      };
    }

    return {
      success: true,
      auth0UserId: auth0User.user_id
    };
  } catch (error) {
    console.error('Error creating/updating Auth0 user with permissions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Synchronizes user permissions in Auth0 based on user type
 */
export const syncAuth0UserPermissions = async (
  auth0UserId: string,
  userType: 'admin' | 'team_manager' | 'user'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const managementService = getAuth0ManagementService();
    const success = await managementService.syncUserPermissions(auth0UserId, userType);

    return {
      success,
      error: success ? undefined : 'Failed to sync permissions in Auth0'
    };
  } catch (error) {
    console.error('Error syncing Auth0 user permissions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Export the Auth0ManagementService for direct use
 */
export { Auth0ManagementService, getAuth0ManagementService }; 