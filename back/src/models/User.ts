export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'admin' | 'team_manager' | 'user';
  companyId?: string;
  teamId?: string; // Team the user belongs to
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  auth0UserId: string;
}

export interface UserCreateRequest {
  email: string;
  firstName: string;
  lastName: string;
  userType: 'admin' | 'team_manager' | 'user';
  companyId?: string;
  teamId?: string;
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  userType?: 'admin' | 'team_manager' | 'user';
  companyId?: string;
  teamId?: string;
  isActive?: boolean;
}

export interface UserWithTeamInfo extends User {
  teamName?: string;
  teamManagerId?: string;
  teamManagerName?: string;
} 