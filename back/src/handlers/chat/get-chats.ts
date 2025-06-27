import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, chatService } from '../../lib/common';
import { getEmailFromToken } from '../../lib/auth';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Get user email from authentication token
    const userEmail = getEmailFromToken(event);
    if (!userEmail) {
      return createResponse(401, { 
        error: 'Unauthorized', 
        message: 'Valid authentication token required' 
      });
    }

    // Parse query parameters
    const limit = event.queryStringParameters?.limit 
      ? parseInt(event.queryStringParameters.limit, 10) 
      : 20;

    if (isNaN(limit) || limit <= 0 || limit > 100) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Limit must be a number between 1 and 100' 
      });
    }

    // Get user's chats
    const result = await chatService.getUserChats(userEmail, limit);

    return createResponse(200, { 
      data: result,
      message: 'Chats retrieved successfully' 
    });

  } catch (error) {
    console.error('Error getting chats:', error);
    
    if (error instanceof Error) {
      return createResponse(500, { 
        error: 'Internal Server Error', 
        message: error.message 
      });
    }

    return createResponse(500, { 
      error: 'Internal Server Error', 
      message: 'An unexpected error occurred' 
    });
  }
}; 