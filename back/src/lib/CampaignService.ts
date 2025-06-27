import { DatabaseService, BaseEntity } from './DatabaseService';
import { Campaign, CampaignCreateRequest, CampaignUpdateRequest } from '../models/Campaign';
import { v4 as uuidv4 } from 'uuid';

export interface CampaignEntity extends BaseEntity {
  EntityType: 'CAMPAIGN';
  name: string;
  description?: string;
  companyId: string;
  isActive: boolean;
  status: 'draft' | 'active' | 'completed' | 'archived';
  startDate?: string;
  endDate?: string;
  createdBy: string;
}

export class CampaignService {
  constructor(private db: DatabaseService) {}

  // Key patterns for single table design
  private getCampaignPK(campaignId: string): string {
    return `CAMPAIGN#${campaignId}`;
  }

  private getCampaignSK(): string {
    return 'PROFILE';
  }

  private mapToEntity(campaign: Campaign): CampaignEntity {
    return {
      PK: this.getCampaignPK(campaign.id),
      SK: this.getCampaignSK(),
      GSI1PK: `COMPANY#${campaign.companyId}`, // For company's campaigns
      GSI1SK: `CAMPAIGN#${campaign.id}`,
      GSI2PK: `CREATED_BY#${campaign.createdBy}`, // For admin's campaigns
      GSI2SK: `CAMPAIGN#${campaign.id}`,
      EntityType: 'CAMPAIGN',
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      companyId: campaign.companyId,
      isActive: campaign.isActive,
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      createdBy: campaign.createdBy,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt
    };
  }

  private mapFromEntity(entity: CampaignEntity): Campaign {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      companyId: entity.companyId,
      isActive: entity.isActive,
      status: entity.status,
      startDate: entity.startDate,
      endDate: entity.endDate,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  async createCampaign(request: CampaignCreateRequest, createdBy: string): Promise<Campaign> {
    // Generate UUID for the campaign first
    const campaignId = uuidv4();
    
    const campaign: Campaign = {
      id: campaignId,
      name: request.name,
      description: request.description,
      companyId: request.companyId,
      isActive: true,
      status: request.status || 'draft',
      startDate: request.startDate,
      endDate: request.endDate,
      createdBy,
      createdAt: '',
      updatedAt: ''
    };

    const entity = this.mapToEntity(campaign);
    const createdEntity = await this.db.create(entity);
    return this.mapFromEntity(createdEntity);
  }

  async getCampaignById(campaignId: string): Promise<Campaign | null> {
    const entity = await this.db.get<CampaignEntity>(
      this.getCampaignPK(campaignId),
      this.getCampaignSK()
    );
    return entity ? this.mapFromEntity(entity) : null;
  }

  async getCampaignsByCompany(companyId: string): Promise<Campaign[]> {
    const entities = await this.db.queryByGSI1<CampaignEntity>(`COMPANY#${companyId}`);
    return entities.map(entity => this.mapFromEntity(entity));
  }

  async getCampaignsByCreator(createdBy: string): Promise<Campaign[]> {
    const entities = await this.db.queryByGSI2<CampaignEntity>(`CREATED_BY#${createdBy}`);
    return entities.map(entity => this.mapFromEntity(entity));
  }

  async updateCampaign(campaignId: string, request: CampaignUpdateRequest): Promise<Campaign> {
    const updates: Partial<CampaignEntity> = {};
    
    if (request.name !== undefined) updates.name = request.name;
    if (request.description !== undefined) updates.description = request.description;
    if (request.status !== undefined) updates.status = request.status;
    if (request.startDate !== undefined) updates.startDate = request.startDate;
    if (request.endDate !== undefined) updates.endDate = request.endDate;
    if (request.isActive !== undefined) updates.isActive = request.isActive;

    const updatedEntity = await this.db.update<CampaignEntity>(
      this.getCampaignPK(campaignId),
      this.getCampaignSK(),
      updates
    );

    return this.mapFromEntity(updatedEntity);
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    await this.db.delete(this.getCampaignPK(campaignId), this.getCampaignSK());
  }

  async getActiveCampaignsByCompany(companyId: string): Promise<Campaign[]> {
    const campaigns = await this.getCampaignsByCompany(companyId);
    return campaigns.filter(campaign => campaign.isActive);
  }

  async getAllCampaigns(): Promise<Campaign[]> {
    const entities = await this.db.scanByEntityType<CampaignEntity>('CAMPAIGN');
    return entities.map((entity: CampaignEntity) => this.mapFromEntity(entity));
  }
} 