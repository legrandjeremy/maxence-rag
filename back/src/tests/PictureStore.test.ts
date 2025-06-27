import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { Picture } from '../models/Picture';
import PictureStore from '../lib/PictureStore';

// Mock the DynamoDB client
const ddbMock = mockClient(DynamoDBClient);

describe('PictureStore', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  it('should be defined', () => {
    const store = new PictureStore('test-table', new DynamoDBClient({}));
    expect(store).toBeDefined();
  });

  it('should handle a non-existent item gracefully', async () => {
    // Mock empty response for GetItemCommand
    ddbMock.on(GetItemCommand).resolves({ Item: undefined });
    
    const store = new PictureStore('test-table', new DynamoDBClient({}));
    const result = await store.getPictureById('non-existent-id');
    
    expect(result).toBeNull();
  });
}); 