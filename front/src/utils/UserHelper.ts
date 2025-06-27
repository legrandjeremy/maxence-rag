import { jwtDecode } from 'jwt-decode'

export interface User {
  id: string
  uciId?: number
  email: string
  familyName: string
  givenName: string
  createdAt: string
  roles?: Role[]
  commissaireDisciplines?: string[]
  federation?: number
  isCompetitionApprover?: boolean
  details?: {
      countryId?: number | null
      countryCode?: string | null
      organisationId?: string | null
  }
}

export interface Role {
  id: string,
  name: string,
  description: string
}

export interface UserMetaData {
  roles?: RoleMetaData[],
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

interface CustomJwtPayload {
  'https//defi.maijin/email'?: string,
  'https//defi.maijin/app_metadata'?: UserMetaData,
  exp?: number,
  iat?: number
}

class UserHelper {
    private token: string;
    private decodedToken: CustomJwtPayload;
    private appMetadata: UserMetaData;
  
    constructor(token: string) {
      this.token = token;
      this.decodedToken = jwtDecode<CustomJwtPayload>(this.token);

      this.appMetadata = this.decodedToken['https//defi.maijin/app_metadata'] ?? {};
    }

    getAppMetadata = () => {
      return this.appMetadata;
    }

    getEmail = () => {
      return this.decodedToken['https//defi.maijin/email'] ?? '';
    }

    getDisplayName = () => {
      return this.appMetadata.displayName ?? '';
    }
  
    hasRole = (role: string) => {
      return this.appMetadata.roles ? this.appMetadata.roles.some(r => r.role === role) : false
    }
    
    getCountryIdForRole = (role: string) => {
      if (this.appMetadata) {
        return this.appMetadata.roles?.find(r => r.role === role)?.details?.countryId ?? ''
      }
      return null
    }

    getCountryCodeForRole = (role: string) => {
      if (this.appMetadata) {
        return this.appMetadata.roles?.find(r => r.role === role)?.details?.countryCode ?? ''
      }
      return null
    }

    getOrganisationIdForRole = (role: string) => {
      if (this.appMetadata) {
        return this.appMetadata.roles?.find(r => r.role === role)?.details?.organisationId ?? ''
      }
      return null
    }
  }

  export default UserHelper;
  