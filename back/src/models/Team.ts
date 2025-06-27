export interface Team {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  managerId?: string; // User ID of the team manager
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // Admin user ID
}

export interface TeamCreateRequest {
  name: string;
  description?: string;
  companyId: string;
  managerId?: string;
}

export interface TeamUpdateRequest {
  name?: string;
  description?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  joinedAt: string;
  addedBy: string; // Admin or Team Manager user ID
}

export interface TeamMemberCreateRequest {
  teamId: string;
  userId: string;
}

export interface TeamMemberAddRequest {
  userId: string;
}

export interface TeamStats {
  teamId: string;
  totalMembers: number;
  activeCampaigns: number;
  totalPointsEarned: number;
  averageProgress: number;
} 