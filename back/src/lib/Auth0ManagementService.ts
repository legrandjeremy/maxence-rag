import { ManagementClient } from 'auth0';

export interface Auth0UserData {
  user_id: string;
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  app_metadata?: {
    roles?: string[];
    permissions?: string[];
  };
  user_metadata?: Record<string, unknown>;
}

export interface Auth0Permission {
  permission_name: string;
  resource_server_identifier: string;
}

export interface Auth0Role {
  id: string;
  name: string;
  description?: string;
}

export class Auth0ManagementService {
  private client: ManagementClient;
  private audience: string;

  constructor() {
    const domain = process.env.AUTH0_DOMAIN;
    const clientId = process.env.AUTH0_MANAGEMENT_CLIENT_ID;
    const clientSecret = process.env.AUTH0_MANAGEMENT_CLIENT_SECRET;
    this.audience = process.env.AUTH0_AUDIENCE || 'https://defi.maijin';

    if (!domain || !clientId || !clientSecret) {
      throw new Error('Auth0 Management API credentials are not properly configured');
    }

    this.client = new ManagementClient({
      domain,
      clientId,
      clientSecret,
      scope: 'read:users update:users create:users read:roles update:roles assign:roles read:role_members'
    });
  }

  /**
   * Get user by email from Auth0
   */
  async getUserByEmail(email: string): Promise<Auth0UserData | null> {
    try {
      const users = await this.client.users.getByEmail({ email });
      return users.length > 0 ? users[0] as Auth0UserData : null;
    } catch (error) {
      console.error('Error getting Auth0 user by email:', error);
      return null;
    }
  }

  /**
   * Get user by Auth0 ID
   */
  async getUserById(userId: string): Promise<Auth0UserData | null> {
    try {
      const user = await this.client.users.get({ id: userId });
      return user as Auth0UserData;
    } catch (error) {
      console.error('Error getting Auth0 user by ID:', error);
      return null;
    }
  }

  /**
   * Create a new user in Auth0
   */
  async createUser(email: string, firstName: string, lastName: string): Promise<Auth0UserData | null> {
    try {
      const userData = {
        email,
        given_name: firstName,
        family_name: lastName,
        name: `${firstName} ${lastName}`,
        connection: 'Username-Password-Authentication', // Default connection
        email_verified: false,
        verify_email: true
      };

      const user = await this.client.users.create(userData);
      return user as Auth0UserData;
    } catch (error) {
      console.error('Error creating Auth0 user:', error);
      return null;
    }
  }

  /**
   * Update user metadata in Auth0
   */
  async updateUserMetadata(userId: string, appMetadata: Record<string, unknown>): Promise<boolean> {
    try {
      await this.client.users.update(
        { id: userId },
        { app_metadata: appMetadata }
      );
      return true;
    } catch (error) {
      console.error('Error updating Auth0 user metadata:', error);
      return false;
    }
  }

  /**
   * Get available roles from Auth0
   */
  async getRoles(): Promise<Auth0Role[]> {
    try {
      const roles = await this.client.roles.getAll();
      return roles as Auth0Role[];
    } catch (error) {
      console.error('Error getting Auth0 roles:', error);
      return [];
    }
  }

  /**
   * Assign roles to a user
   */
  async assignRolesToUser(userId: string, roleIds: string[]): Promise<boolean> {
    try {
      await this.client.users.assignRoles(
        { id: userId },
        { roles: roleIds }
      );
      return true;
    } catch (error) {
      console.error('Error assigning roles to Auth0 user:', error);
      return false;
    }
  }

  /**
   * Remove roles from a user
   */
  async removeRolesFromUser(userId: string, roleIds: string[]): Promise<boolean> {
    try {
      await this.client.users.removeRoles(
        { id: userId },
        { roles: roleIds }
      );
      return true;
    } catch (error) {
      console.error('Error removing roles from Auth0 user:', error);
      return false;
    }
  }

  /**
   * Get user's roles
   */
  async getUserRoles(userId: string): Promise<Auth0Role[]> {
    try {
      const roles = await this.client.users.getRoles({ id: userId });
      return roles as Auth0Role[];
    } catch (error) {
      console.error('Error getting Auth0 user roles:', error);
      return [];
    }
  }

  /**
   * Get permissions for a role
   */
  async getRolePermissions(roleId: string): Promise<Auth0Permission[]> {
    try {
      const permissions = await this.client.roles.getPermissions({ id: roleId });
      return permissions as Auth0Permission[];
    } catch (error) {
      console.error('Error getting Auth0 role permissions:', error);
      return [];
    }
  }

  /**
   * Map user type to Auth0 role ID
   */
  private getUserTypeToRoleMapping(): Record<string, string> {
    return {
      'admin': process.env.AUTH0_ADMIN_ROLE_ID || '',
      'team_manager': process.env.AUTH0_TEAM_MANAGER_ROLE_ID || '',
      'user': process.env.AUTH0_USER_ROLE_ID || ''
    };
  }

  /**
   * Synchronize user permissions with Auth0 based on user type
   */
  async syncUserPermissions(userId: string, userType: 'admin' | 'team_manager' | 'user'): Promise<boolean> {
    try {
      const roleMapping = this.getUserTypeToRoleMapping();
      const targetRoleId = roleMapping[userType];

      if (!targetRoleId) {
        console.error(`No Auth0 role ID configured for user type: ${userType}`);
        return false;
      }

      // Get current user roles
      const currentRoles = await this.getUserRoles(userId);
      const currentRoleIds = currentRoles.map(role => role.id);

      // Get all possible role IDs for this application
      const allAppRoleIds = Object.values(roleMapping).filter(id => id);

      // Remove existing application roles
      const rolesToRemove = currentRoleIds.filter(roleId => allAppRoleIds.includes(roleId));
      if (rolesToRemove.length > 0) {
        await this.removeRolesFromUser(userId, rolesToRemove);
      }

      // Assign the new role
      await this.assignRolesToUser(userId, [targetRoleId]);

      // Update app metadata for additional context
      const appMetadata = {
        user_type: userType,
        permissions: this.getPermissionsForUserType(userType),
        last_updated: new Date().toISOString()
      };

      await this.updateUserMetadata(userId, appMetadata);

      return true;
    } catch (error) {
      console.error('Error syncing Auth0 user permissions:', error);
      return false;
    }
  }

  /**
   * Get permissions array for a user type
   */
  private getPermissionsForUserType(userType: string): string[] {
    const permissionsMap: Record<string, string[]> = {
      'admin': [
        'maijin-defi-challenge:admin',
        'maijin-defi-challenge:team-manager',
        'maijin-defi-challenge:user',
        'maijin-defi-challenge:read',
        'maijin-defi-challenge:write'
      ],
      'team_manager': [
        'maijin-defi-challenge:team-manager',
        'maijin-defi-challenge:user',
        'maijin-defi-challenge:read',
        'maijin-defi-challenge:write'
      ],
      'user': [
        'maijin-defi-challenge:user',
        'maijin-defi-challenge:read'
      ]
    };

    return permissionsMap[userType] || [];
  }

  /**
   * Check if user exists in Auth0
   */
  async userExists(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    return user !== null;
  }

  /**
   * Create or update user in Auth0 and sync permissions
   */
  async createOrUpdateUserWithPermissions(
    email: string, 
    firstName: string, 
    lastName: string, 
    userType: 'admin' | 'team_manager' | 'user'
  ): Promise<Auth0UserData | null> {
    try {
      // Check if user already exists
      let user = await this.getUserByEmail(email);
      
      if (!user) {
        // Create new user
        user = await this.createUser(email, firstName, lastName);
        if (!user) {
          return null;
        }
      }

      // Sync permissions
      const syncSuccess = await this.syncUserPermissions(user.user_id, userType);
      if (!syncSuccess) {
        console.error('Failed to sync permissions for user:', user.user_id);
      }

      // Return updated user data
      return await this.getUserById(user.user_id);
    } catch (error) {
      console.error('Error creating/updating Auth0 user with permissions:', error);
      return null;
    }
  }
} 