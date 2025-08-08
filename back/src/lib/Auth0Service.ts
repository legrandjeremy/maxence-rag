import axios from 'axios';
import { Role, Organization } from '../models/User';

const auth0IssuerUrl = process.env.AUTH0_ISSUER_URL || "";
const auth0Audience = process.env.AUTH0_AUDIENCE_MANAGEMENT || "";
const auth0ClientId = process.env.AUTH0_CLIENT_ID || "";
const auth0ClientSecret = process.env.AUTH0_CLIENT_SECRET || "";
class Auth0Service {
  private domain: string;
  private clientId: string;
  private clientSecret: string;
  private audience: string
  private token: string | null;

  constructor(domain: string, clientId: string, clientSecret: string, audience: string) {
    this.domain = domain;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.audience = audience;
    this.token = null;
  }

  private async authenticate(): Promise<string> {
    try {
      const response = await axios.post(`${this.domain}oauth/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        audience: this.audience,
        grant_type: 'client_credentials',
      });
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting management token on Auth0:', error);
      throw new Error('Failed to get management token on Auth0');
    }
  }

  // Ensure the client is authenticated
  private async ensureAuthenticated(): Promise<void> {
    if (!this.token) {
      this.token = await this.authenticate();
    }
  }

  public async getUserByEmail(userEmail: string): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await axios.get(`${this.domain}api/v2/users-by-email` , {
        params: {email: userEmail },
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error finding user on Auth0:', error);
      throw new Error('Failed to get user on Auth0');
    }
  }

  public async createUser(userData: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await axios.post(`${this.domain}api/v2/users`, userData, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating user on Auth0:', error);
      throw new Error('Failed to create user on Auth0');
    }
  }

  public async resetPassword(userInviteData: UserInviteData): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const ticketData = {
        email: userInviteData.email,
        connection: userInviteData.connection
      };
      
      const ticket = await axios.post(`${this.domain}dbconnections/change_password`, ticketData, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Error inviting user on Auth0:', error);
      throw new Error('Failed to invite user on Auth0');
    }
  }

  // Add inviteUser method for backward compatibility with the tests
  public async inviteUser(userInviteData: UserInviteData): Promise<any> {
    return this.resetPassword(userInviteData);
  }

  public async updateUser(userId: string, userData: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await axios.patch(`${this.domain}api/v2/users/${userId}`, userData, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user on Auth0:', error);
      throw new Error('Failed to update user on Auth0');
    }
  }

  public async getRoles(): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await axios.get(`${this.domain}api/v2/roles`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting roles on Auth0:', error);
      throw new Error('Failed to get roles on Auth0');
    }
  }

  public async getUserRoles(userId: string): Promise<Role[]> {
    await this.ensureAuthenticated();
    try {
      const response = await axios.get(`${this.domain}api/v2/users/${userId}/roles`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting user roles on Auth0:', error);
      throw new Error('Failed to get user roles on Auth0');
    }
  }

  public async assignUserRoles(userId: string, roleIds:string[]): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const auth0Roles = {
        roles: roleIds
      };

      const response = await axios.post(`${this.domain}api/v2/users/${userId}/roles`, auth0Roles, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning roles on Auth0:', error);
      throw new Error('Failed to assign roles on Auth0');
    }
  }

  public async removeUserRoles(userId: string, roleIds:string[]): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await axios.delete(`${this.domain}api/v2/users/${userId}/roles`, {
        data: { roles: roleIds },
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error removing roles on Auth0:', error);
      throw new Error('Failed to remove roles on Auth0');
    }
  }

  public async deleteUser(userId: string): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await axios.delete(`${this.domain}api/v2/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting user on Auth0:', error);
      throw new Error('Failed to delete user on Auth0');
    }
  }

  // Organization Management Methods

  public async getOrganizations(): Promise<Organization[]> {
    await this.ensureAuthenticated();
    try {
      const response = await axios.get(`${this.domain}api/v2/organizations`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
      return response.data.map((org: any) => ({
        id: org.id,
        name: org.name,
        display_name: org.display_name,
        branding: org.branding
      }));
    } catch (error) {
      console.error('Error getting organizations from Auth0:', error);
      throw new Error('Failed to get organizations from Auth0');
    }
  }

  public async getUserOrganizations(userId: string): Promise<Organization[]> {
    await this.ensureAuthenticated();
    try {
      const response = await axios.get(`${this.domain}api/v2/users/${userId}/organizations`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
      return response.data.map((org: any) => ({
        id: org.id,
        name: org.name,
        display_name: org.display_name,
        branding: org.branding
      }));
    } catch (error) {
      console.error('Error getting user organizations from Auth0:', error);
      throw new Error('Failed to get user organizations from Auth0');
    }
  }

  public async assignUserToOrganizations(userId: string, organizationIds: string[]): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const promises = organizationIds.map(orgId => 
        axios.post(`${this.domain}api/v2/organizations/${orgId}/members`, {
          members: [userId]
        }, {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        })
      );
      
      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      console.error('Error assigning user to organizations in Auth0:', error);
      throw new Error('Failed to assign user to organizations in Auth0');
    }
  }

  public async removeUserFromOrganizations(userId: string, organizationIds: string[]): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const promises = organizationIds.map(orgId => 
        axios.delete(`${this.domain}api/v2/organizations/${orgId}/members`, {
          headers: {
            Authorization: `Bearer ${this.token}`
          },
          data: {
            members: [userId]
          }
        })
      );
      
      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      console.error('Error removing user from organizations in Auth0:', error);
      throw new Error('Failed to remove user from organizations in Auth0');
    }
  }

  public async assignUserRolesToOrganization(userId: string, organizationId: string, roleIds: string[]): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await axios.post(`${this.domain}api/v2/organizations/${organizationId}/members/${userId}/roles`, {
        roles: roleIds
      }, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning user roles to organization in Auth0:', error);
      throw new Error('Failed to assign user roles to organization in Auth0');
    }
  }

  public async removeUserRolesFromOrganization(userId: string, organizationId: string, roleIds: string[]): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await axios.delete(`${this.domain}api/v2/organizations/${organizationId}/members/${userId}/roles`, {
        data: { roles: roleIds },
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error removing user roles from organization in Auth0:', error);
      throw new Error('Failed to remove user roles from organization in Auth0');
    }
  }

  public async getUserRolesInOrganization(userId: string, organizationId: string): Promise<Role[]> {
    await this.ensureAuthenticated();
    try {
      const response = await axios.get(`${this.domain}api/v2/organizations/${organizationId}/members/${userId}/roles`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting user roles in organization from Auth0:', error);
      throw new Error('Failed to get user roles in organization from Auth0');
    }
  }
}

export interface SimpleAuth0User {
    email : string
    given_name: string,
    family_name: string,
    app_metadata: UserMetaData,
    password: string,
    connection: string
}
export interface UserMetaData {
  roles?: RoleMetaData[],
  organizations?: string[],
  displayName?: string
}

export interface RoleMetaData {
  role: string;
  details?: {
    countryId?: number | null;
    countryCode?: string | null;
    organisationId?: string | null;
  };
}

export interface UserInviteData {
  email: string;
  given_name: string;
  family_name: string;
  connection: string;
  app_metadata?: UserMetaData;
}

export {auth0IssuerUrl, auth0Audience, auth0ClientId, auth0ClientSecret}
export default Auth0Service;