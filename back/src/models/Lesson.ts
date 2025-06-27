export interface Lesson {
  id: string;
  campaignId: string;
  name: string;
  description?: string;
  points: number;
  order: number; // For ordering lessons within a campaign
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // Admin user ID
}

export interface LessonCreateRequest {
  campaignId: string;
  name: string;
  description?: string;
  points: number;
  order: number;
}

export interface LessonUpdateRequest {
  name?: string;
  description?: string;
  points?: number;
  order?: number;
  isActive?: boolean;
} 