import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  UpdateCommand, 
  DeleteCommand,
  BatchGetCommand,
  BatchWriteCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

// Entity types for single table design
export type EntityType = 
  | 'USER' 
  | 'COMPANY' 
  | 'CAMPAIGN' 
  | 'LESSON' 
  | 'DOCUMENT' 
  | 'USER_PROGRESS'
  | 'TEAM'
  | 'TEAM_MEMBER'
  | 'CHAT'
  | 'CHAT_MESSAGE';

// Base interface for all entities
export interface BaseEntity {
  PK: string; // Partition Key
  SK: string; // Sort Key
  GSI1PK?: string; // Global Secondary Index 1 Partition Key
  GSI1SK?: string; // Global Secondary Index 1 Sort Key
  GSI2PK?: string; // Global Secondary Index 2 Partition Key
  GSI2SK?: string; // Global Secondary Index 2 Sort Key
  EntityType: EntityType;
  id: string;
  createdAt: string;
  updatedAt: string;
}

export class DatabaseService {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor(dynamoClient: DynamoDBClient, tableName: string) {
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = tableName;
  }

  // Generic CRUD operations
  async create<T extends BaseEntity>(entity: T): Promise<T> {
    const now = new Date().toISOString();
    const entityWithTimestamps = {
      ...entity,
      id: entity.id || uuidv4(),
      createdAt: now,
      updatedAt: now
    };

    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: entityWithTimestamps,
      ConditionExpression: 'attribute_not_exists(PK)'
    }));

    return entityWithTimestamps;
  }

  async get<T extends BaseEntity>(pk: string, sk: string): Promise<T | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: pk, SK: sk }
    }));

    return result.Item as T || null;
  }

  async update<T extends BaseEntity>(
    pk: string, 
    sk: string, 
    updates: Partial<T>
  ): Promise<T> {
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Add updatedAt timestamp
    updates.updatedAt = new Date().toISOString();

    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined && key !== 'PK' && key !== 'SK') {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        updateExpression.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = value;
      }
    });

    const result = await this.client.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { PK: pk, SK: sk },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return result.Attributes as T;
  }

  async delete(pk: string, sk: string): Promise<void> {
    await this.client.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { PK: pk, SK: sk }
    }));
  }

  // Query operations using GSI
  async queryByGSI1<T extends BaseEntity>(
    gsi1pk: string, 
    gsi1sk?: string,
    limit?: number
  ): Promise<T[]> {
    const params: any = {
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: { ':gsi1pk': gsi1pk }
    };

    if (gsi1sk) {
      params.KeyConditionExpression += ' AND GSI1SK = :gsi1sk';
      params.ExpressionAttributeValues[':gsi1sk'] = gsi1sk;
    }

    if (limit) {
      params.Limit = limit;
    }

    const result = await this.client.send(new QueryCommand(params));
    return result.Items as T[] || [];
  }

  // Query by GSI1 with sort key prefix
  async queryByGSI1WithPrefix<T extends BaseEntity>(
    gsi1pk: string, 
    gsi1skPrefix?: string,
    limit?: number
  ): Promise<T[]> {
    const params: any = {
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: { ':gsi1pk': gsi1pk }
    };

    if (gsi1skPrefix) {
      params.KeyConditionExpression += ' AND begins_with(GSI1SK, :gsi1skPrefix)';
      params.ExpressionAttributeValues[':gsi1skPrefix'] = gsi1skPrefix;
    }

    if (limit) {
      params.Limit = limit;
    }

    const result = await this.client.send(new QueryCommand(params));
    return result.Items as T[] || [];
  }

  async queryByGSI2<T extends BaseEntity>(
    gsi2pk: string, 
    gsi2sk?: string,
    limit?: number
  ): Promise<T[]> {
    const params: any = {
      TableName: this.tableName,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :gsi2pk',
      ExpressionAttributeValues: { ':gsi2pk': gsi2pk }
    };

    if (gsi2sk) {
      params.KeyConditionExpression += ' AND GSI2SK = :gsi2sk';
      params.ExpressionAttributeValues[':gsi2sk'] = gsi2sk;
    }

    if (limit) {
      params.Limit = limit;
    }

    const result = await this.client.send(new QueryCommand(params));
    return result.Items as T[] || [];
  }

  // Query by primary key with sort key prefix
  async queryByPK<T extends BaseEntity>(
    pk: string, 
    skPrefix?: string,
    limit?: number
  ): Promise<T[]> {
    const params: any = {
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': pk }
    };

    if (skPrefix) {
      params.KeyConditionExpression += ' AND begins_with(SK, :skPrefix)';
      params.ExpressionAttributeValues[':skPrefix'] = skPrefix;
    }

    if (limit) {
      params.Limit = limit;
    }

    const result = await this.client.send(new QueryCommand(params));
    return result.Items as T[] || [];
  }

  // Batch operations
  async batchGet<T extends BaseEntity>(keys: Array<{PK: string, SK: string}>): Promise<T[]> {
    if (keys.length === 0) return [];

    const result = await this.client.send(new BatchGetCommand({
      RequestItems: {
        [this.tableName]: {
          Keys: keys
        }
      }
    }));

    return result.Responses?.[this.tableName] as T[] || [];
  }

  async batchWrite<T extends BaseEntity>(
    itemsToWrite: T[], 
    itemsToDelete?: Array<{PK: string, SK: string}>
  ): Promise<void> {
    const writeRequests: any[] = [];

    // Add items to write
    itemsToWrite.forEach(item => {
      writeRequests.push({
        PutRequest: { Item: item }
      });
    });

    // Add items to delete
    itemsToDelete?.forEach(key => {
      writeRequests.push({
        DeleteRequest: { Key: key }
      });
    });

    if (writeRequests.length === 0) return;

    // DynamoDB batch write has a limit of 25 items
    const chunks = [];
    for (let i = 0; i < writeRequests.length; i += 25) {
      chunks.push(writeRequests.slice(i, i + 25));
    }

    for (const chunk of chunks) {
      await this.client.send(new BatchWriteCommand({
        RequestItems: {
          [this.tableName]: chunk
        }
      }));
    }
  }

  // Scan operations
  async scanByEntityType<T extends BaseEntity>(entityType: EntityType): Promise<T[]> {
    const result = await this.client.send(new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'EntityType = :entityType',
      ExpressionAttributeValues: {
        ':entityType': entityType
      }
    }));

    return result.Items as T[] || [];
  }
} 