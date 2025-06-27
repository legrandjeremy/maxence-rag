import { DatabaseService, BaseEntity } from './DatabaseService';
import { User, UserCreateRequest, UserUpdateRequest } from '../models/User';
import { v4 as uuidv4 } from 'uuid';

export interface UserEntity extends BaseEntity {
  EntityType: 'USER';
  email: string;
  firstName: string;
  lastName: string;
  userType: 'admin' | 'team_manager' | 'user';
  companyId?: string;
  teamId?: string;
  isActive: boolean;
  auth0UserId: string;
}

export class UserService {
  constructor(private db: DatabaseService) {}

  // Key patterns for single table design
  private getUserPK(userId: string): string {
    return `USER#${userId}`;
  }

  private getUserSK(): string {
    return 'PROFILE';
  }

  private mapToEntity(user: User): UserEntity {
    return {
      PK: this.getUserPK(user.id),
      SK: this.getUserSK(),
      GSI1PK: `EMAIL#${user.email}`, // For email lookups
      GSI1SK: `USER#${user.id}`,
      GSI2PK: user.companyId ? `COMPANY#${user.companyId}` : undefined, // For company user lookups
      GSI2SK: `USER#${user.id}`,
      EntityType: 'USER',
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      companyId: user.companyId,
      teamId: user.teamId,
      isActive: user.isActive,
      auth0UserId: user.auth0UserId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  private mapFromEntity(entity: UserEntity): User {
    return {
      id: entity.id,
      email: entity.email,
      firstName: entity.firstName,
      lastName: entity.lastName,
      userType: entity.userType,
      companyId: entity.companyId,
      teamId: entity.teamId,
      isActive: entity.isActive,
      auth0UserId: entity.auth0UserId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  async createUser(request: UserCreateRequest, auth0UserId: string, createdBy: string): Promise<User> {
    // Generate UUID for the user first
    const userId = uuidv4();
    
    const user: User = {
      id: userId,
      email: request.email,
      firstName: request.firstName,
      lastName: request.lastName,
      userType: request.userType,
      companyId: request.companyId,
      teamId: request.teamId,
      isActive: true,
      auth0UserId,
      createdAt: '',
      updatedAt: ''
    };

    const entity = this.mapToEntity(user);
    const createdEntity = await this.db.create(entity);
    return this.mapFromEntity(createdEntity);
  }

  async getUserById(userId: string): Promise<User | null> {
    const entity = await this.db.get<UserEntity>(
      this.getUserPK(userId),
      this.getUserSK()
    );
    return entity ? this.mapFromEntity(entity) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const entities = await this.db.queryByGSI1<UserEntity>(`EMAIL#${email}`, undefined, 1);
    return entities.length > 0 ? this.mapFromEntity(entities[0]) : null;
  }

  async getUserByAuth0Id(auth0UserId: string): Promise<User | null> {
    // Since we don't have a GSI for auth0UserId, we need to scan
    // This is not ideal for production, but necessary given current schema
    // TODO: Consider adding a GSI for auth0UserId in future schema updates
    const allEntities = await this.db.scanByEntityType<UserEntity>('USER');
    const userEntity = allEntities.find((entity: UserEntity) => 
      entity.auth0UserId === auth0UserId
    );
    return userEntity ? this.mapFromEntity(userEntity) : null;
  }

  async getUsersByCompany(companyId: string): Promise<User[]> {
    const entities = await this.db.queryByGSI2<UserEntity>(`COMPANY#${companyId}`);
    return entities.map(entity => this.mapFromEntity(entity));
  }



  async updateUser(userId: string, request: UserUpdateRequest): Promise<User> {
    const updates: Partial<UserEntity> = {};
    
    if (request.firstName !== undefined) updates.firstName = request.firstName;
    if (request.lastName !== undefined) updates.lastName = request.lastName;
    if (request.userType !== undefined) updates.userType = request.userType;
    if (request.companyId !== undefined) {
      updates.companyId = request.companyId;
      updates.GSI2PK = `COMPANY#${request.companyId}`;
    }
    if (request.teamId !== undefined) {
      updates.teamId = request.teamId;
      updates.GSI2SK = `USER#${userId}`;
    }
    if (request.isActive !== undefined) updates.isActive = request.isActive;

    const updatedEntity = await this.db.update<UserEntity>(
      this.getUserPK(userId),
      this.getUserSK(),
      updates
    );

    return this.mapFromEntity(updatedEntity);
  }

  async deleteUser(userId: string): Promise<void> {
    await this.db.delete(this.getUserPK(userId), this.getUserSK());
  }

  async getAllUsers(): Promise<User[]> {
    // Scan all user entities - not ideal for production with large datasets
    // Consider implementing pagination or GSI for better performance
    const entities = await this.db.scanByEntityType<UserEntity>('USER');
    return entities.map(entity => this.mapFromEntity(entity));
  }

  async getAllAdmins(): Promise<User[]> {
    // This would require a scan, so we'll implement a GSI for user types if needed
    // For now, we'll query all users and filter (not ideal for production)
    throw new Error('getAllAdmins requires additional GSI implementation');
  }


} 