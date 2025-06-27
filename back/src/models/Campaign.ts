export interface Campaign {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  isActive: boolean;
  status: 'draft' | 'active' | 'completed' | 'archived';
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // Admin user ID
}

export interface CampaignCreateRequest {
  name: string;
  description?: string;
  companyId: string;
  status?: 'draft' | 'active' | 'completed' | 'archived';
  startDate?: string;
  endDate?: string;
}

export interface CampaignUpdateRequest {
  name?: string;
  description?: string;
  status?: 'draft' | 'active' | 'completed' | 'archived';
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
} 