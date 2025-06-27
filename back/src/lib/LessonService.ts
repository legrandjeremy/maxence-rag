import { DatabaseService, BaseEntity } from './DatabaseService';
import { Lesson, LessonCreateRequest, LessonUpdateRequest } from '../models/Lesson';
import { v4 as uuidv4 } from 'uuid';

export interface LessonEntity extends BaseEntity {
  EntityType: 'LESSON';
  campaignId: string;
  name: string;
  description?: string;
  points: number;
  order: number;
  isActive: boolean;
  createdBy: string;
}

export class LessonService {
  constructor(private db: DatabaseService) {}

  // Key patterns for single table design
  private getLessonPK(lessonId: string): string {
    return `LESSON#${lessonId}`;
  }

  private getLessonSK(): string {
    return 'PROFILE';
  }

  private mapToEntity(lesson: Lesson): LessonEntity {
    return {
      PK: this.getLessonPK(lesson.id),
      SK: this.getLessonSK(),
      GSI1PK: `CAMPAIGN#${lesson.campaignId}`, // For campaign's lessons
      GSI1SK: `ORDER#${lesson.order.toString().padStart(3, '0')}#LESSON#${lesson.id}`, // For ordered lessons
      GSI2PK: `CREATED_BY#${lesson.createdBy}`, // For admin's lessons
      GSI2SK: `LESSON#${lesson.id}`,
      EntityType: 'LESSON',
      id: lesson.id,
      campaignId: lesson.campaignId,
      name: lesson.name,
      description: lesson.description,
      points: lesson.points,
      order: lesson.order,
      isActive: lesson.isActive,
      createdBy: lesson.createdBy,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt
    };
  }

  private mapFromEntity(entity: LessonEntity): Lesson {
    return {
      id: entity.id,
      campaignId: entity.campaignId,
      name: entity.name,
      description: entity.description,
      points: entity.points,
      order: entity.order,
      isActive: entity.isActive,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  async createLesson(request: LessonCreateRequest, createdBy: string): Promise<Lesson> {
    // Generate UUID for the lesson first
    const lessonId = uuidv4();
    
    const lesson: Lesson = {
      id: lessonId,
      campaignId: request.campaignId,
      name: request.name,
      description: request.description,
      points: request.points,
      order: request.order,
      isActive: true,
      createdBy,
      createdAt: '',
      updatedAt: ''
    };

    const entity = this.mapToEntity(lesson);
    const createdEntity = await this.db.create(entity);
    return this.mapFromEntity(createdEntity);
  }

  async getLessonById(lessonId: string): Promise<Lesson | null> {
    const entity = await this.db.get<LessonEntity>(
      this.getLessonPK(lessonId),
      this.getLessonSK()
    );
    return entity ? this.mapFromEntity(entity) : null;
  }

  async getLessonsByCampaign(campaignId: string): Promise<Lesson[]> {
    const entities = await this.db.queryByGSI1<LessonEntity>(`CAMPAIGN#${campaignId}`);
    // Sort by order since GSI1SK includes order
    return entities
      .map(entity => this.mapFromEntity(entity))
      .sort((a, b) => a.order - b.order);
  }

  async getLessonsByCreator(createdBy: string): Promise<Lesson[]> {
    const entities = await this.db.queryByGSI2<LessonEntity>(`CREATED_BY#${createdBy}`);
    return entities.map(entity => this.mapFromEntity(entity));
  }

  async updateLesson(lessonId: string, request: LessonUpdateRequest): Promise<Lesson> {
    const updates: Partial<LessonEntity> = {};
    
    if (request.name !== undefined) updates.name = request.name;
    if (request.description !== undefined) updates.description = request.description;
    if (request.points !== undefined) updates.points = request.points;
    if (request.order !== undefined) {
      updates.order = request.order;
      // Update GSI1SK to maintain order
      const currentLesson = await this.getLessonById(lessonId);
      if (currentLesson) {
        updates.GSI1SK = `ORDER#${request.order.toString().padStart(3, '0')}#LESSON#${lessonId}`;
      }
    }
    if (request.isActive !== undefined) updates.isActive = request.isActive;

    const updatedEntity = await this.db.update<LessonEntity>(
      this.getLessonPK(lessonId),
      this.getLessonSK(),
      updates
    );

    return this.mapFromEntity(updatedEntity);
  }

  async deleteLesson(lessonId: string): Promise<void> {
    await this.db.delete(this.getLessonPK(lessonId), this.getLessonSK());
  }

  async getActiveLessonsByCampaign(campaignId: string): Promise<Lesson[]> {
    const lessons = await this.getLessonsByCampaign(campaignId);
    return lessons.filter(lesson => lesson.isActive);
  }

  async reorderLessons(campaignId: string, lessonOrders: Array<{lessonId: string, order: number}>): Promise<void> {
    const updatePromises = lessonOrders.map(async ({ lessonId, order }) => {
      return this.updateLesson(lessonId, { order });
    });

    await Promise.all(updatePromises);
  }
} 