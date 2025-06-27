import { DatabaseService, BaseEntity } from './DatabaseService';
import { LessonDocument, LessonDocumentCreateRequest, LessonDocumentUpdateRequest } from '../models/LessonDocument';
import { v4 as uuidv4 } from 'uuid';

export interface LessonDocumentEntity extends BaseEntity {
  EntityType: 'LESSON_DOCUMENT';
  lessonId: string;
  name: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  order: number;
  isActive: boolean;
  createdBy: string;
}

export class LessonDocumentService {
  constructor(private db: DatabaseService) {}

  // Key patterns for single table design
  private getLessonDocumentPK(documentId: string): string {
    return `LESSON_DOCUMENT#${documentId}`;
  }

  private getLessonDocumentSK(): string {
    return 'PROFILE';
  }

  private mapToEntity(document: LessonDocument): LessonDocumentEntity {
    return {
      PK: this.getLessonDocumentPK(document.id),
      SK: this.getLessonDocumentSK(),
      GSI1PK: `LESSON#${document.lessonId}`, // For lesson's documents
      GSI1SK: `ORDER#${document.order.toString().padStart(3, '0')}#DOCUMENT#${document.id}`, // For ordered documents
      GSI2PK: `CREATED_BY#${document.createdBy}`, // For admin's documents
      GSI2SK: `LESSON_DOCUMENT#${document.id}`,
      EntityType: 'LESSON_DOCUMENT',
      id: document.id,
      lessonId: document.lessonId,
      name: document.name,
      description: document.description,
      fileName: document.fileName,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      s3Key: document.s3Key,
      order: document.order,
      isActive: document.isActive,
      createdBy: document.createdBy,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    };
  }

  private mapFromEntity(entity: LessonDocumentEntity): LessonDocument {
    return {
      id: entity.id,
      lessonId: entity.lessonId,
      name: entity.name,
      description: entity.description,
      fileName: entity.fileName,
      fileSize: entity.fileSize,
      mimeType: entity.mimeType,
      s3Key: entity.s3Key,
      order: entity.order,
      isActive: entity.isActive,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  async createLessonDocument(request: LessonDocumentCreateRequest, s3Key: string, createdBy: string): Promise<LessonDocument> {
    const documentId = uuidv4();
    const now = new Date().toISOString();
    
    const document: LessonDocument = {
      id: documentId,
      lessonId: request.lessonId,
      name: request.name,
      description: request.description,
      fileName: request.fileName,
      fileSize: request.fileSize,
      mimeType: request.mimeType,
      s3Key,
      order: request.order,
      isActive: true,
      createdBy,
      createdAt: now,
      updatedAt: now
    };

    const entity = this.mapToEntity(document);
    const createdEntity = await this.db.create(entity);
    return this.mapFromEntity(createdEntity);
  }

  async getLessonDocumentById(documentId: string): Promise<LessonDocument | null> {
    const entity = await this.db.get<LessonDocumentEntity>(
      this.getLessonDocumentPK(documentId),
      this.getLessonDocumentSK()
    );
    return entity ? this.mapFromEntity(entity) : null;
  }

  async getLessonDocuments(lessonId: string): Promise<LessonDocument[]> {
    const entities = await this.db.queryByGSI1<LessonDocumentEntity>(`LESSON#${lessonId}`);
    // Sort by order since GSI1SK includes order
    return entities
      .filter(entity => entity.EntityType === 'LESSON_DOCUMENT' && entity.isActive)
      .map(entity => this.mapFromEntity(entity))
      .sort((a, b) => a.order - b.order);
  }

  async updateLessonDocument(documentId: string, request: LessonDocumentUpdateRequest): Promise<LessonDocument> {
    const updates: Partial<LessonDocumentEntity> = {
      updatedAt: new Date().toISOString()
    };
    
    if (request.name !== undefined) updates.name = request.name;
    if (request.description !== undefined) updates.description = request.description;
    if (request.isActive !== undefined) updates.isActive = request.isActive;
    
    if (request.order !== undefined) {
      updates.order = request.order;
      // Update GSI1SK to maintain order
      const currentDocument = await this.getLessonDocumentById(documentId);
      if (currentDocument) {
        updates.GSI1SK = `ORDER#${request.order.toString().padStart(3, '0')}#DOCUMENT#${documentId}`;
      }
    }

    const updatedEntity = await this.db.update<LessonDocumentEntity>(
      this.getLessonDocumentPK(documentId),
      this.getLessonDocumentSK(),
      updates
    );

    return this.mapFromEntity(updatedEntity);
  }

  async deleteLessonDocument(documentId: string): Promise<void> {
    // Mark as inactive instead of hard delete to preserve audit trail
    await this.updateLessonDocument(documentId, { isActive: false });
  }

  async reorderLessonDocuments(lessonId: string, documentOrders: Array<{documentId: string, order: number}>): Promise<void> {
    const updatePromises = documentOrders.map(async ({ documentId, order }) => {
      return this.updateLessonDocument(documentId, { order });
    });

    await Promise.all(updatePromises);
  }

  async getDocumentsByCreator(createdBy: string): Promise<LessonDocument[]> {
    const entities = await this.db.queryByGSI2<LessonDocumentEntity>(`CREATED_BY#${createdBy}`);
    return entities
      .filter(entity => entity.EntityType === 'LESSON_DOCUMENT')
      .map(entity => this.mapFromEntity(entity));
  }
} 