import { DatabaseService, BaseEntity } from './DatabaseService';
import { Team, TeamCreateRequest, TeamUpdateRequest, TeamMember, TeamMemberCreateRequest, TeamStats } from '../models/Team';
import { v4 as uuidv4 } from 'uuid';

export interface TeamEntity extends BaseEntity {
  EntityType: 'TEAM';
  companyId: string;
  name: string;
  description?: string;
  managerId?: string;
  isActive: boolean;
  createdBy: string;
}

export interface TeamMemberEntity extends BaseEntity {
  EntityType: 'TEAM_MEMBER';
  teamId: string;
  userId: string;
  joinedAt: string;
  addedBy: string;
}

export class TeamService {
  constructor(private db: DatabaseService) {}

  // Key patterns for single table design
  private getTeamPK(teamId: string): string {
    return `TEAM#${teamId}`;
  }

  private getTeamSK(): string {
    return 'PROFILE';
  }

  private getTeamMemberPK(teamId: string): string {
    return `TEAM#${teamId}`;
  }

  private getTeamMemberSK(userId: string): string {
    return `MEMBER#${userId}`;
  }

  private mapTeamToEntity(team: Team): TeamEntity {
    return {
      PK: this.getTeamPK(team.id),
      SK: this.getTeamSK(),
      GSI1PK: `COMPANY#${team.companyId}`, // For company's teams
      GSI1SK: `TEAM#${team.id}`,
      GSI2PK: team.managerId ? `MANAGER#${team.managerId}` : undefined, // For manager's teams
      GSI2SK: team.managerId ? `TEAM#${team.id}` : undefined,
      EntityType: 'TEAM',
      id: team.id,
      companyId: team.companyId,
      name: team.name,
      description: team.description,
      managerId: team.managerId,
      isActive: team.isActive,
      createdBy: team.createdBy,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt
    };
  }

  private mapTeamFromEntity(entity: TeamEntity): Team {
    return {
      id: entity.id,
      companyId: entity.companyId,
      name: entity.name,
      description: entity.description,
      managerId: entity.managerId,
      isActive: entity.isActive,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  private mapTeamMemberToEntity(teamMember: TeamMember): TeamMemberEntity {
    return {
      PK: this.getTeamMemberPK(teamMember.teamId),
      SK: this.getTeamMemberSK(teamMember.userId),
      GSI1PK: `USER#${teamMember.userId}`, // For user's team membership
      GSI1SK: `TEAM#${teamMember.teamId}`,
      EntityType: 'TEAM_MEMBER',
      id: teamMember.id,
      teamId: teamMember.teamId,
      userId: teamMember.userId,
      joinedAt: teamMember.joinedAt,
      addedBy: teamMember.addedBy,
      createdAt: teamMember.joinedAt, // Use joinedAt as createdAt
      updatedAt: teamMember.joinedAt // Initially same as createdAt
    };
  }

  private mapTeamMemberFromEntity(entity: TeamMemberEntity): TeamMember {
    return {
      id: entity.id,
      teamId: entity.teamId,
      userId: entity.userId,
      joinedAt: entity.joinedAt,
      addedBy: entity.addedBy
    };
  }

  async createTeam(request: TeamCreateRequest, createdBy: string): Promise<Team> {
    const teamId = uuidv4();
    const now = new Date().toISOString();
    
    const team: Team = {
      id: teamId,
      name: request.name,
      description: request.description,
      companyId: request.companyId,
      managerId: request.managerId,
      isActive: true,
      createdBy,
      createdAt: now,
      updatedAt: now
    };

    const entity = this.mapTeamToEntity(team);
    const createdEntity = await this.db.create(entity);
    return this.mapTeamFromEntity(createdEntity);
  }

  async getTeamById(teamId: string): Promise<Team | null> {
    const entity = await this.db.get<TeamEntity>(
      this.getTeamPK(teamId),
      this.getTeamSK()
    );
    return entity ? this.mapTeamFromEntity(entity) : null;
  }

  async getTeamsByCompany(companyId: string): Promise<Team[]> {
    const entities = await this.db.queryByGSI1<TeamEntity>(`COMPANY#${companyId}`);
    return entities
      .filter(entity => entity.EntityType === 'TEAM')
      .map(entity => this.mapTeamFromEntity(entity));
  }

  async getTeamsByManager(managerId: string): Promise<Team[]> {
    if (!managerId) return [];
    
    const entities = await this.db.queryByGSI2<TeamEntity>(`MANAGER#${managerId}`);
    return entities
      .filter(entity => entity.EntityType === 'TEAM')
      .map(entity => this.mapTeamFromEntity(entity));
  }

  async updateTeam(teamId: string, request: TeamUpdateRequest): Promise<Team> {
    const updates: Partial<TeamEntity> = {
      updatedAt: new Date().toISOString()
    };
    
    if (request.name !== undefined) updates.name = request.name;
    if (request.description !== undefined) updates.description = request.description;
    if (request.isActive !== undefined) updates.isActive = request.isActive;
    
    // Handle manager change
    if (request.managerId !== undefined) {
      updates.managerId = request.managerId;
      if (request.managerId) {
        updates.GSI2PK = `MANAGER#${request.managerId}`;
        updates.GSI2SK = `TEAM#${teamId}`;
      } else {
        updates.GSI2PK = undefined;
        updates.GSI2SK = undefined;
      }
    }

    const updatedEntity = await this.db.update<TeamEntity>(
      this.getTeamPK(teamId),
      this.getTeamSK(),
      updates
    );

    return this.mapTeamFromEntity(updatedEntity);
  }

  async deleteTeam(teamId: string): Promise<void> {
    // First remove all team members
    const members = await this.getTeamMembers(teamId);
    for (const member of members) {
      await this.removeTeamMember(teamId, member.userId);
    }
    
    // Then delete the team
    await this.db.delete(this.getTeamPK(teamId), this.getTeamSK());
  }

  async addTeamMember(request: TeamMemberCreateRequest, addedBy: string): Promise<TeamMember> {
    const memberId = uuidv4();
    const now = new Date().toISOString();
    
    const teamMember: TeamMember = {
      id: memberId,
      teamId: request.teamId,
      userId: request.userId,
      joinedAt: now,
      addedBy
    };

    const entity = this.mapTeamMemberToEntity(teamMember);
    const createdEntity = await this.db.create(entity);
    return this.mapTeamMemberFromEntity(createdEntity);
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await this.db.delete(
      this.getTeamMemberPK(teamId),
      this.getTeamMemberSK(userId)
    );
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const entities = await this.db.queryByPK<TeamMemberEntity>(
      this.getTeamMemberPK(teamId),
      'MEMBER#'
    );
    return entities
      .filter(entity => entity.EntityType === 'TEAM_MEMBER')
      .map(entity => this.mapTeamMemberFromEntity(entity));
  }

  async getUserTeam(userId: string): Promise<TeamMember | null> {
    const entities = await this.db.queryByGSI1<TeamMemberEntity>(`USER#${userId}`);
    const teamMemberEntity = entities.find(entity => entity.EntityType === 'TEAM_MEMBER');
    return teamMemberEntity ? this.mapTeamMemberFromEntity(teamMemberEntity) : null;
  }

  async getTeamStats(teamId: string): Promise<TeamStats> {
    const members = await this.getTeamMembers(teamId);
    
    // This would typically involve aggregating user progress data
    // For now, return basic stats
    return {
      teamId,
      totalMembers: members.length,
      activeCampaigns: 0, // Would need to query user progress
      totalPointsEarned: 0, // Would need to query user progress
      averageProgress: 0 // Would need to query user progress
    };
  }
} 