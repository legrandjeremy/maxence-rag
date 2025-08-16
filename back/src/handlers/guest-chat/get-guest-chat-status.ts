import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, databaseService } from '../../lib/common';
import { BaseEntity } from '../../lib/DatabaseService';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const chatId = event.pathParameters?.chatId;
    if (!chatId) {
      return createResponse(400, {
        error: 'Bad Request',
        message: 'Chat ID is required'
      });
    }

    const email = event.queryStringParameters?.email;
    if (!email || !email.trim()) {
      return createResponse(400, {
        error: 'Bad Request',
        message: 'Email is required'
      });
    }

    const userEmail = email.trim().toLowerCase();

    interface MinimalChat extends BaseEntity {
      EntityType: 'CHAT';
      isActive: boolean;
      isPaid?: boolean;
      paywallAt?: string | null;
      lastMessageAt: string;
    }
    const chat = await databaseService.get<MinimalChat>(`CHAT#${userEmail}`, `CHAT#${chatId}`);
    if (!chat || chat.EntityType !== 'CHAT' || !chat.isActive) {
      return createResponse(404, {
        error: 'Not Found',
        message: 'Chat not found or access denied'
      });
    }

    const status = {
      isPaid: !!chat.isPaid,
      paywallAt: chat.paywallAt || null,
      lastMessageAt: chat.lastMessageAt
    };

    return createResponse(200, { data: status });
  } catch (error) {
    console.error('Error getting guest chat status:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return createResponse(500, { error: 'Internal Server Error', message });
  }
};


