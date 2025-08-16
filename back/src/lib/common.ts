import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { UserService } from "./UserService"
import { CampaignService } from "./CampaignService"
import { BedrockService } from "./BedrockService"
import { DatabaseService } from "./DatabaseService"
import { ChatService } from "./ChatService"
import { APIGatewayProxyResult } from 'aws-lambda'

// Check if we're in a test environment
const isTest = process.env.NODE_ENV === 'test';
const isSAMLocal = process.env.AWS_SAM_LOCAL === 'true';

// Set up DynamoDB options
const options = isSAMLocal ? {
    endpoint: process.env.DYNAMODB_ENDPOINT || 'http://host.docker.internal:8000'
} : isTest ? {
    region: 'us-east-1', // Mock region for tests
    endpoint: 'http://localhost:8000', // Mock endpoint for tests
    credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
    }
} : {};

// Create clients
const dynamoClient = new DynamoDBClient(options);

// Set up table names and environment variables
const environment = process.env.ENVIRONMENT || 'dev';
const tableName = `${environment}-luna-front`;
const s3BucketName = `${environment}-luna-front-documents`;
const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN || 'test-cf-domain.cloudfront.net';

// Bedrock configuration
const bedrockRegion = 'us-east-1';
const knowledgeBaseId = process.env.BEDROCK_KNOWLEDGE_BASE_ID || 'X9CIYS980F';

// Create services
const databaseService = new DatabaseService(dynamoClient, tableName);
const bedrockService = new BedrockService({
  region: bedrockRegion,
  knowledgeBaseId: knowledgeBaseId
});
const userService = new UserService(databaseService);
const campaignService = new CampaignService(databaseService);
const chatService = new ChatService(databaseService, bedrockService);

export const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
  };
};

export {
    dynamoClient,
    tableName,
    s3BucketName,
    cloudfrontDomain,
    bedrockRegion,
    knowledgeBaseId,
    databaseService,
    bedrockService,
    userService,
    campaignService,
    chatService
};