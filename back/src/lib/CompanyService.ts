import { DatabaseService, BaseEntity } from './DatabaseService';
import { Company, CompanyCreateRequest, CompanyUpdateRequest } from '../models/Company';
import { v4 as uuidv4 } from 'uuid';

export interface CompanyEntity extends BaseEntity {
  EntityType: 'COMPANY';
  name: string;
  description?: string;
  isActive: boolean;
  createdBy: string;
}

export class CompanyService {
  constructor(private db: DatabaseService) {}

  // Key patterns for single table design
  private getCompanyPK(companyId: string): string {
    return `COMPANY#${companyId}`;
  }

  private getCompanySK(): string {
    return 'PROFILE';
  }

  private mapToEntity(company: Company): CompanyEntity {
    return {
      PK: this.getCompanyPK(company.id),
      SK: this.getCompanySK(),
      GSI1PK: 'COMPANIES', // For listing all companies
      GSI1SK: `COMPANY#${company.id}`,
      GSI2PK: `CREATED_BY#${company.createdBy}`, // For admin's companies
      GSI2SK: `COMPANY#${company.id}`,
      EntityType: 'COMPANY',
      id: company.id,
      name: company.name,
      description: company.description,
      isActive: company.isActive,
      createdBy: company.createdBy,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt
    };
  }

  private mapFromEntity(entity: CompanyEntity): Company {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      isActive: entity.isActive,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  async createCompany(request: CompanyCreateRequest, createdBy: string): Promise<Company> {
    // Generate UUID for the company first
    const companyId = uuidv4();
    
    const company: Company = {
      id: companyId,
      name: request.name,
      description: request.description,
      isActive: true,
      createdBy,
      createdAt: '',
      updatedAt: ''
    };

    const entity = this.mapToEntity(company);
    const createdEntity = await this.db.create(entity);
    return this.mapFromEntity(createdEntity);
  }

  async getCompanyById(companyId: string): Promise<Company | null> {
    const entity = await this.db.get<CompanyEntity>(
      this.getCompanyPK(companyId),
      this.getCompanySK()
    );
    return entity ? this.mapFromEntity(entity) : null;
  }

  async getAllCompanies(): Promise<Company[]> {
    const entities = await this.db.queryByGSI1<CompanyEntity>('COMPANIES');
    return entities.map(entity => this.mapFromEntity(entity));
  }

  async getCompaniesByCreator(createdBy: string): Promise<Company[]> {
    const entities = await this.db.queryByGSI2<CompanyEntity>(`CREATED_BY#${createdBy}`);
    return entities.map(entity => this.mapFromEntity(entity));
  }

  async updateCompany(companyId: string, request: CompanyUpdateRequest): Promise<Company> {
    const updates: Partial<CompanyEntity> = {};
    
    if (request.name !== undefined) updates.name = request.name;
    if (request.description !== undefined) updates.description = request.description;
    if (request.isActive !== undefined) updates.isActive = request.isActive;

    const updatedEntity = await this.db.update<CompanyEntity>(
      this.getCompanyPK(companyId),
      this.getCompanySK(),
      updates
    );

    return this.mapFromEntity(updatedEntity);
  }

  async deleteCompany(companyId: string): Promise<void> {
    await this.db.delete(this.getCompanyPK(companyId), this.getCompanySK());
  }

  async getActiveCompanies(): Promise<Company[]> {
    const allCompanies = await this.getAllCompanies();
    return allCompanies.filter(company => company.isActive);
  }

  async getCompaniesByTeamManager(teamManagerId: string): Promise<Company[]> {
    // Import TeamService here to avoid circular dependency
    const { teamService } = require('./common');
    
    // Get all teams managed by this team manager
    const managedTeams = await teamService.getTeamsByManager(teamManagerId);
    
    // Extract unique company IDs from the teams
    const companyIds = [...new Set(managedTeams.map((team: any) => team.companyId))] as string[];
    
    // Get company details for each unique company ID
    const companies = await Promise.all(
      companyIds.map(async (companyId) => {
        const company = await this.getCompanyById(companyId);
        return company;
      })
    );
    
    // Filter out null results and return only active companies
    return companies
      .filter((company): company is Company => company !== null && company.isActive);
  }
} 