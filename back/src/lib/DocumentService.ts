import { DatabaseService, BaseEntity } from './DatabaseService';
import { Document, DocumentCreateRequest, DocumentUpdateRequest } from '../models/Document';
import { v4 as uuidv4 } from 'uuid';

export interface DocumentEntity extends BaseEntity {
  EntityType: 'DOCUMENT';
  name: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  campaignId?: string;
  lessonId?: string;
  order: number;
  isActive: boolean;
  createdBy: string;
}

export class DocumentService {
  constructor(private db: DatabaseService) {}

  // Key patterns for single table design
  private getDocumentPK(documentId: string): string {
    return `DOCUMENT#${documentId}`;
  }

  private getDocumentSK(): string {
    return 'PROFILE';
  }

  private mapToEntity(document: Document): DocumentEntity {
    return {
      PK: this.getDocumentPK(document.id),
      SK: this.getDocumentSK(),
      GSI1PK: document.campaignId ? `CAMPAIGN#${document.campaignId}` : 
              document.lessonId ? `LESSON#${document.lessonId}` : 'ORPHAN_DOCUMENTS',
      GSI1SK: `ORDER#${document.order.toString().padStart(3, '0')}#DOCUMENT#${document.id}`,
      GSI2PK: `CREATED_BY#${document.createdBy}`, // For admin's documents
      GSI2SK: `DOCUMENT#${document.id}`,
      EntityType: 'DOCUMENT',
      id: document.id,
      name: document.name,
      description: document.description,
      fileName: document.fileName,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      s3Key: document.s3Key,
      campaignId: document.campaignId,
      lessonId: document.lessonId,
      order: document.order,
      isActive: document.isActive,
      createdBy: document.createdBy,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    };
  }

  private mapFromEntity(entity: DocumentEntity): Document {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      fileName: entity.fileName,
      fileSize: entity.fileSize,
      mimeType: entity.mimeType,
      s3Key: entity.s3Key,
      campaignId: entity.campaignId,
      lessonId: entity.lessonId,
      order: entity.order,
      isActive: entity.isActive,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  async createDocument(request: DocumentCreateRequest, s3Key: string, createdBy: string): Promise<Document> {
    // Generate UUID for the document first
    const documentId = uuidv4();
    
    const document: Document = {
      id: documentId,
      name: request.name,
      description: request.description,
      fileName: request.fileName,
      fileSize: request.fileSize,
      mimeType: request.mimeType,
      s3Key,
      campaignId: request.campaignId,
      lessonId: request.lessonId,
      order: request.order,
      isActive: true,
      createdBy,
      createdAt: '',
      updatedAt: ''
    };

    const entity = this.mapToEntity(document);
    const createdEntity = await this.db.create(entity);
    return this.mapFromEntity(createdEntity);
  }

  async getDocumentById(documentId: string): Promise<Document | null> {
    const entity = await this.db.get<DocumentEntity>(
      this.getDocumentPK(documentId),
      this.getDocumentSK()
    );
    return entity ? this.mapFromEntity(entity) : null;
  }

  async getDocumentsByCampaign(campaignId: string): Promise<Document[]> {
    const entities = await this.db.queryByGSI1<DocumentEntity>(`CAMPAIGN#${campaignId}`);
    return entities
      .map(entity => this.mapFromEntity(entity))
      .sort((a, b) => a.order - b.order);
  }

  async getDocumentsByLesson(lessonId: string): Promise<Document[]> {
    const entities = await this.db.queryByGSI1<DocumentEntity>(`LESSON#${lessonId}`);
    return entities
      .map(entity => this.mapFromEntity(entity))
      .sort((a, b) => a.order - b.order);
  }

  async getDocumentsByCreator(createdBy: string): Promise<Document[]> {
    const entities = await this.db.queryByGSI2<DocumentEntity>(`CREATED_BY#${createdBy}`);
    return entities.map(entity => this.mapFromEntity(entity));
  }

  async updateDocument(documentId: string, request: DocumentUpdateRequest): Promise<Document> {
    const updates: Partial<DocumentEntity> = {};
    
    if (request.name !== undefined) updates.name = request.name;
    if (request.description !== undefined) updates.description = request.description;
    if (request.order !== undefined) {
      updates.order = request.order;
      // Update GSI1SK to maintain order
      const currentDocument = await this.getDocumentById(documentId);
      if (currentDocument) {
        const gsi1pk = currentDocument.campaignId ? `CAMPAIGN#${currentDocument.campaignId}` : 
                      currentDocument.lessonId ? `LESSON#${currentDocument.lessonId}` : 'ORPHAN_DOCUMENTS';
        updates.GSI1SK = `ORDER#${request.order.toString().padStart(3, '0')}#DOCUMENT#${documentId}`;
      }
    }
    if (request.isActive !== undefined) updates.isActive = request.isActive;

    const updatedEntity = await this.db.update<DocumentEntity>(
      this.getDocumentPK(documentId),
      this.getDocumentSK(),
      updates
    );

    return this.mapFromEntity(updatedEntity);
  }

  async deleteDocument(documentId: string): Promise<void> {
    await this.db.delete(this.getDocumentPK(documentId), this.getDocumentSK());
  }

  async getActiveDocumentsByCampaign(campaignId: string): Promise<Document[]> {
    const documents = await this.getDocumentsByCampaign(campaignId);
    return documents.filter(document => document.isActive);
  }

  async getActiveDocumentsByLesson(lessonId: string): Promise<Document[]> {
    const documents = await this.getDocumentsByLesson(lessonId);
    return documents.filter(document => document.isActive);
  }

  async reorderDocuments(
    parentId: string, 
    parentType: 'campaign' | 'lesson',
    documentOrders: Array<{documentId: string, order: number}>
  ): Promise<void> {
    const updatePromises = documentOrders.map(async ({ documentId, order }) => {
      return this.updateDocument(documentId, { order });
    });

    await Promise.all(updatePromises);
  }
} 