export interface Document {
  id: string;
  name: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  campaignId?: string; // If document is campaign-level
  lessonId?: string; // If document is lesson-level
  order: number; // For ordering documents
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // Admin user ID
}

export interface DocumentCreateRequest {
  name: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  campaignId?: string;
  lessonId?: string;
  order: number;
}

export interface DocumentUpdateRequest {
  name?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
} 