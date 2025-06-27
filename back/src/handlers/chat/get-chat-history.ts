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

    // Get chat ID from path parameters
    const chatId = event.pathParameters?.chatId;
    if (!chatId) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Chat ID is required' 
      });
    }

    // Parse query parameters
    const limit = event.queryStringParameters?.limit 
      ? parseInt(event.queryStringParameters.limit, 10) 
      : 50;

    if (isNaN(limit) || limit <= 0 || limit > 100) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Limit must be a number between 1 and 100' 
      });
    }

    // Verify chat exists and belongs to user
    const chat = await chatService.getChatById(userEmail, chatId);
    if (!chat) {
      return createResponse(404, { 
        error: 'Not Found', 
        message: 'Chat not found or access denied' 
      });
    }

    // Get chat history
    const result = await chatService.getChatHistory(chatId, limit);

    return createResponse(200, { 
      data: result,
      message: 'Chat history retrieved successfully' 
    });

  } catch (error) {
    console.error('Error getting chat history:', error);
    
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