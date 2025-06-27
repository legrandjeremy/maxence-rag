import { DatabaseService, BaseEntity } from './DatabaseService';
import { 
  UserProgress, 
  UserProgressCreateRequest,
  UserProgressUpdateRequest,
  UserCampaignStats, 
  TeamManagerDashboard 
} from '../models/UserProgress';
import { v4 as uuidv4 } from 'uuid';

export interface UserProgressEntity extends BaseEntity {
  EntityType: 'USER_PROGRESS';
  userId: string;
  lessonId: string;
  campaignId: string;
  pointsEarned: number;
  maxPoints: number;
  completedAt: string;
  assignedBy?: string;
  teamId?: string;
  notes?: string;
}

export class UserProgressService {
  constructor(private db: DatabaseService) {}

  // Key patterns for single table design
  private getUserProgressPK(progressId: string): string {
    return `USER_PROGRESS#${progressId}`;
  }

  private getUserProgressSK(): string {
    return 'PROFILE';
  }

  private mapToEntity(progress: UserProgress): UserProgressEntity {
    return {
      PK: this.getUserProgressPK(progress.id),
      SK: this.getUserProgressSK(),
      GSI1PK: `USER#${progress.userId}`, // For user's progress
      GSI1SK: `CAMPAIGN#${progress.campaignId}#LESSON#${progress.lessonId}`,
      GSI2PK: `CAMPAIGN#${progress.campaignId}`, // For campaign progress
      GSI2SK: `USER#${progress.userId}#LESSON#${progress.lessonId}`,
      EntityType: 'USER_PROGRESS',
      id: progress.id,
      userId: progress.userId,
      lessonId: progress.lessonId,
      campaignId: progress.campaignId,
      pointsEarned: progress.pointsEarned,
      maxPoints: progress.maxPoints,
      completedAt: progress.completedAt,
      assignedBy: progress.assignedBy,
      teamId: progress.teamId,
      notes: progress.notes,
      createdAt: progress.createdAt,
      updatedAt: progress.updatedAt
    };
  }

  private mapFromEntity(entity: UserProgressEntity): UserProgress {
    return {
      id: entity.id,
      userId: entity.userId,
      lessonId: entity.lessonId,
      campaignId: entity.campaignId,
      pointsEarned: entity.pointsEarned,
      maxPoints: entity.maxPoints,
      completedAt: entity.completedAt,
      assignedBy: entity.assignedBy,
      teamId: entity.teamId,
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  async createUserProgress(request: UserProgressCreateRequest): Promise<UserProgress> {
    const progressId = uuidv4();
    const now = new Date().toISOString();
    
    const progress: UserProgress = {
      id: progressId,
      userId: request.userId,
      lessonId: request.lessonId,
      campaignId: request.campaignId,
      pointsEarned: request.pointsEarned,
      maxPoints: request.maxPoints,
      completedAt: now,
      assignedBy: request.assignedBy,
      teamId: request.teamId,
      notes: request.notes,
      createdAt: now,
      updatedAt: now
    };

    const entity = this.mapToEntity(progress);
    const createdEntity = await this.db.create(entity);
    return this.mapFromEntity(createdEntity);
  }

  async getUserProgress(userId: string, lessonId: string, campaignId: string): Promise<UserProgress | null> {
    // Query by GSI1 to find the progress record
    const entities = await this.db.queryByGSI1<UserProgressEntity>(
      `USER#${userId}`,
      `CAMPAIGN#${campaignId}#LESSON#${lessonId}`
    );
    
    const progressEntity = entities.find(entity => entity.EntityType === 'USER_PROGRESS');
    return progressEntity ? this.mapFromEntity(progressEntity) : null;
  }

  async updateUserProgress(progressId: string, request: UserProgressUpdateRequest): Promise<UserProgress> {
    const updates: Partial<UserProgressEntity> = {
      updatedAt: new Date().toISOString()
    };
    
    if (request.pointsEarned !== undefined) {
      updates.pointsEarned = request.pointsEarned;
      updates.completedAt = new Date().toISOString();
    }
    
    if (request.notes !== undefined) updates.notes = request.notes;
    if (request.assignedBy !== undefined) updates.assignedBy = request.assignedBy;

    const updatedEntity = await this.db.update<UserProgressEntity>(
      this.getUserProgressPK(progressId),
      this.getUserProgressSK(),
      updates
    );

    return this.mapFromEntity(updatedEntity);
  }

  async getUserProgressByCampaign(userId: string, campaignId: string): Promise<UserProgress[]> {
    const entities = await this.db.queryByGSI1WithPrefix<UserProgressEntity>(
      `USER#${userId}`,
      `CAMPAIGN#${campaignId}`
    );

    return entities
      .filter(entity => entity.EntityType === 'USER_PROGRESS')
      .map(entity => this.mapFromEntity(entity));
  }

  async getCampaignProgress(campaignId: string): Promise<UserProgress[]> {
    const entities = await this.db.queryByGSI2<UserProgressEntity>(`CAMPAIGN#${campaignId}`);
    return entities
      .filter(entity => entity.EntityType === 'USER_PROGRESS')
      .map(entity => this.mapFromEntity(entity));
  }

  async getUserCampaignStats(userId: string, campaignId: string): Promise<UserCampaignStats> {
    const userProgress = await this.getUserProgressByCampaign(userId, campaignId);
    
    const totalPoints = userProgress.reduce((sum, progress) => sum + progress.pointsEarned, 0);
    const completedLessons = userProgress.length;
    const lastActivity = userProgress.length > 0 
      ? userProgress.reduce((latest, progress) => 
          progress.completedAt > latest ? progress.completedAt : latest, 
          userProgress[0].completedAt
        )
      : '';

    // Get team info if available
    const teamId = userProgress.length > 0 ? userProgress[0].teamId : undefined;

    return {
      userId,
      campaignId,
      totalPoints,
      completedLessons,
      totalLessons: 0, // Will be filled by calling service
      lastActivity,
      teamId,
      teamName: undefined // Will be filled by calling service
    };
  }

  async getTeamManagerDashboard(
    teamManagerId: string,
    teamId: string,
    teamName: string,
    userIds: string[], 
    campaignId: string
  ): Promise<TeamManagerDashboard> {
    const userStatsPromises = userIds.map(userId => 
      this.getUserCampaignStats(userId, campaignId)
    );
    
    const userStats = await Promise.all(userStatsPromises);
    
    const totalTeamPoints = userStats.reduce((sum, stats) => sum + stats.totalPoints, 0);
    const averageCompletion = userStats.length > 0 
      ? userStats.reduce((sum, stats) => sum + (stats.completedLessons / Math.max(stats.totalLessons, 1)), 0) / userStats.length
      : 0;

    return {
      teamManagerId,
      teamId,
      teamName,
      users: userStats,
      totalTeamPoints,
      averageCompletion
    };
  }

  async getUserLeaderboard(campaignId: string, limit: number = 10): Promise<UserCampaignStats[]> {
    const allProgress = await this.getCampaignProgress(campaignId);
    
    // Group by user and calculate stats
    const userStatsMap = new Map<string, UserCampaignStats>();
    
    for (const progress of allProgress) {
      const existing = userStatsMap.get(progress.userId);
      if (existing) {
        existing.totalPoints += progress.pointsEarned;
        existing.completedLessons += 1;
        if (progress.completedAt > existing.lastActivity) {
          existing.lastActivity = progress.completedAt;
        }
      } else {
        userStatsMap.set(progress.userId, {
          userId: progress.userId,
          campaignId,
          totalPoints: progress.pointsEarned,
          completedLessons: 1,
          totalLessons: 0, // Will be filled by calling service
          lastActivity: progress.completedAt,
          teamId: progress.teamId,
          teamName: undefined // Will be filled by calling service
        });
      }
    }

    // Sort by points and return top users
    return Array.from(userStatsMap.values())
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);
  }

  async hasUserCompletedLesson(userId: string, lessonId: string, campaignId: string): Promise<boolean> {
    const progress = await this.getUserProgress(userId, lessonId, campaignId);
    return progress !== null;
  }

  async deleteUserProgress(progressId: string): Promise<void> {
    await this.db.delete(
      this.getUserProgressPK(progressId),
      this.getUserProgressSK()
    );
  }

  async getTeamProgress(teamId: string, campaignId: string): Promise<UserProgress[]> {
    // This would require a GSI on teamId if we want to query efficiently
    // For now, we can get all campaign progress and filter by teamId
    const allProgress = await this.getCampaignProgress(campaignId);
    return allProgress.filter(progress => progress.teamId === teamId);
  }
} 