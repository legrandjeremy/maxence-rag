export interface LessonDocument {
  id: string;
  lessonId: string;
  name: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  order: number; // For ordering documents within a lesson
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // Admin user ID
}

export interface LessonDocumentCreateRequest {
  lessonId: string;
  name: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  order: number;
}

export interface LessonDocumentUpdateRequest {
  name?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
} 