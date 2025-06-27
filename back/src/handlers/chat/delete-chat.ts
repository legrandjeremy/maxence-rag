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

    // Delete chat
    await chatService.deleteChat(userEmail, chatId);

    return createResponse(200, { 
      message: 'Chat deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting chat:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Chat not found or access denied') {
        return createResponse(404, { 
          error: 'Not Found', 
          message: error.message 
        });
      }

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