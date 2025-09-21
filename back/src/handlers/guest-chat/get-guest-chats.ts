import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, chatService } from '../../lib/common';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Get email from query parameters
    const email = event.queryStringParameters?.email;
    if (!email || !email.trim()) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Email is required' 
      });
    }

    const userEmail = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Invalid email format' 
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

    console.log(`Getting guest chats for email: ${userEmail}`);

    // Get user's chats
    const result = await chatService.getUserChats(userEmail, limit);

    return createResponse(200, { 
      data: result,
      message: 'Chats retrieved successfully' 
    });

  } catch (error) {
    console.error('Error getting guest chats:', error);
    
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
