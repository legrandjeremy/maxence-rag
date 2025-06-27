export interface Company {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // Admin user ID
}

export interface CompanyCreateRequest {
  name: string;
  description?: string;
}

export interface CompanyUpdateRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
} 