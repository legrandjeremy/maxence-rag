import { DynamoDBClient, PutItemCommand, UpdateItemCommand, DeleteItemCommand, GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Picture, PictureCategory } from '../models/Picture';

class PictureStore {
    private tableName: string;
    private dbClient: DynamoDBClient;

    constructor(tableName: string, dbClient: DynamoDBClient) {
        this.tableName = tableName;
        this.dbClient = dbClient;
    }

    async getPictureById(id: string): Promise<Picture | null> {
        const params = {
            TableName: this.tableName,
            Key: marshall({ id, entityType: 'PICTURE' }),
        };

        try {
            const command = new GetItemCommand(params);
            const result = await this.dbClient.send(command);
            return result.Item ? unmarshall(result.Item) as Picture : null;
        } catch (error) {
            console.error('Error getting picture by ID:', error);
            throw error;
        }
    }

    async getPicturesByContactId(contactId: string): Promise<Picture[]> {
        const params = {
            TableName: this.tableName,
            IndexName: 'ContactIdEntityTypeIndex',
            KeyConditionExpression: 'contactId = :contactId AND entityType = :entityType',
            ExpressionAttributeValues: marshall({ 
                ':contactId': contactId,
                ':entityType': 'PICTURE'
            }),
        };

        try {
            const command = new QueryCommand(params);
            const result = await this.dbClient.send(command);
            return result.Items ? result.Items.map(item => unmarshall(item) as Picture) : [];
        } catch (error) {
            console.error('Error getting pictures by UCI ID:', error);
            throw error;
        }
    }

    async getPicturesByContactIdAndCategory(contactId: string, category: string): Promise<Picture[]> {
        const params = {
            TableName: this.tableName,
            IndexName: 'ContactIdCategoryEntityTypeIndex',
            KeyConditionExpression: 'contactId = :contactId AND category = :category',
            FilterExpression: 'entityType = :entityType',
            ExpressionAttributeValues: marshall({ 
                ':contactId': contactId,
                ':category': category,
                ':entityType': 'PICTURE'
            }),
        };

        try {
            const command = new QueryCommand(params);
            const result = await this.dbClient.send(command);
            const pictures = result.Items ? result.Items.map(item => unmarshall(item) as Picture) : [];
            
            // Sort pictures by order
            return pictures.sort((a, b) => (a.order || 0) - (b.order || 0));
        } catch (error) {
            throw error;
        }
    }

    async addPicture(picture: Picture): Promise<void> {
        // Add entity type for single-table design
        const pictureWithEntityType = {
            ...picture,
            entityType: 'PICTURE'
        };

        const params = {
            TableName: this.tableName,
            Item: marshall(pictureWithEntityType),
        };

        try {
            const command = new PutItemCommand(params);
            await this.dbClient.send(command);
            
            // Also update the category counter
            await this.updateCategoryCounter(picture.contactId, picture.category);
            
            console.log('Picture added successfully');
        } catch (error) {
            console.error('Error adding picture:', error);
            throw error;
        }
    }

    async updateCategoryCounter(contactId: string, category: string): Promise<void> {
        // First try to get the existing category
        const params = {
            TableName: this.tableName,
            Key: marshall({ 
                id: `CAT#${contactId}#${category}`,
                entityType: 'CATEGORY'
            }),
        };

        try {
            const getCommand = new GetItemCommand(params);
            const result = await this.dbClient.send(getCommand);
            
            const now = new Date().toISOString();
            
            if (result.Item) {
                // Update existing category
                const updateParams = {
                    TableName: this.tableName,
                    Key: marshall({ 
                        id: `CAT#${contactId}#${category}`,
                        entityType: 'CATEGORY'
                    }),
                    UpdateExpression: 'SET totalPictures = totalPictures + :inc, lastUpdatedAt = :now',
                    ExpressionAttributeValues: marshall({
                        ':inc': 1,
                        ':now': now
                    }),
                };
                
                const updateCommand = new UpdateItemCommand(updateParams);
                await this.dbClient.send(updateCommand);
            } else {
                // Create new category
                const categoryItem: PictureCategory & { entityType: string; id: string } = {
                    id: `CAT#${contactId}#${category}`,
                    entityType: 'CATEGORY',
                    contactId: contactId,
                    category: category,
                    totalPictures: 1,
                    lastUpdatedAt: now
                };
                
                const putParams = {
                    TableName: this.tableName,
                    Item: marshall(categoryItem),
                };
                
                const putCommand = new PutItemCommand(putParams);
                await this.dbClient.send(putCommand);
            }
        } catch (error) {
            console.error('Error updating category counter:', error);
            throw error;
        }
    }

    async getCategories(contactId: number): Promise<PictureCategory[]> {
        const params = {
            TableName: this.tableName,
            IndexName: 'UciIdEntityTypeIndex',
            KeyConditionExpression: 'contactId = :contactId AND entityType = :entityType',
            ExpressionAttributeValues: marshall({ 
                ':contactId': contactId,
                ':entityType': 'CATEGORY'
            }),
        };

        try {
            const command = new QueryCommand(params);
            const result = await this.dbClient.send(command);
            return result.Items ? result.Items.map(item => unmarshall(item) as PictureCategory) : [];
        } catch (error) {
            console.error('Error getting categories by UCI ID:', error);
            throw error;
        }
    }

    async deletePicture(id: string): Promise<void> {
        // First, get the picture to know its category for counter update
        const picture = await this.getPictureById(id);
        if (!picture) {
            throw new Error(`Picture with ID ${id} not found`);
        }
        
        const params = {
            TableName: this.tableName,
            Key: marshall({ id, entityType: 'PICTURE' }),
        };

        try {
            const command = new DeleteItemCommand(params);
            await this.dbClient.send(command);
            
            // Decrement the category counter
            await this.decrementCategoryCounter(picture.contactId, picture.category);
            
            console.log('Picture deleted successfully');
        } catch (error) {
            console.error('Error deleting picture:', error);
            throw error;
        }
    }

    async decrementCategoryCounter(contactId: number, category: string): Promise<void> {
        const now = new Date().toISOString();
        const params = {
            TableName: this.tableName,
            Key: marshall({ 
                id: `CAT#${contactId}#${category}`,
                entityType: 'CATEGORY'
            }),
            UpdateExpression: 'SET totalPictures = totalPictures - :dec, lastUpdatedAt = :now',
            ConditionExpression: 'totalPictures > :zero',
            ExpressionAttributeValues: marshall({
                ':dec': 1,
                ':now': now,
                ':zero': 0
            })
        };

        try {
            const command = new UpdateItemCommand(params);
            await this.dbClient.send(command);
        } catch (error) {
            console.error('Error decrementing category counter:', error);
            throw error;
        }
    }
}

export default PictureStore; 