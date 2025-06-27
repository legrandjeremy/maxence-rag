import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import S3Service from "./S3Service"
import { DatabaseService } from "./DatabaseService"
import { UserService } from "./UserService"
import { CompanyService } from "./CompanyService"
import { CampaignService } from "./CampaignService"
import { LessonService } from "./LessonService"
import { DocumentService } from "./DocumentService"
import { UserProgressService } from "./UserProgressService"
import { TeamService } from "./TeamService"
import { LessonDocumentService } from "./LessonDocumentService"
import { BedrockService } from "./BedrockService"
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
const tableName = `${environment}-player-management`;
const s3BucketName = `${environment}-player-management-documents`;
const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN || 'test-cf-domain.cloudfront.net';

// Bedrock configuration
const bedrockRegion = 'us-east-1';
const knowledgeBaseId = process.env.BEDROCK_KNOWLEDGE_BASE_ID || 'XJSHBJYNTF';

// Create services
const databaseService = new DatabaseService(dynamoClient, tableName);
const s3Service = new S3Service(s3BucketName, cloudfrontDomain);
const bedrockService = new BedrockService({
  region: bedrockRegion,
  knowledgeBaseId: knowledgeBaseId
});
const userService = new UserService(databaseService);
const companyService = new CompanyService(databaseService);
const campaignService = new CampaignService(databaseService);
const lessonService = new LessonService(databaseService);
const documentService = new DocumentService(databaseService);
const userProgressService = new UserProgressService(databaseService);
const teamService = new TeamService(databaseService);
const lessonDocumentService = new LessonDocumentService(databaseService);
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
    s3Service,
    bedrockService,
    userService,
    companyService,
    campaignService,
    lessonService,
    documentService,
    userProgressService,
    teamService,
    lessonDocumentService,
    chatService
};