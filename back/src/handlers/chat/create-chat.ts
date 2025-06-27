import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, chatService } from '../../lib/common';
import { getEmailFromToken } from '../../lib/auth';
import { ChatCreateRequest } from '../../models/Chat';

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

    // Parse request body
    let requestBody: ChatCreateRequest;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Invalid JSON in request body' 
      });
    }

    // Create new chat
    const chat = await chatService.createChat(userEmail, requestBody);

    return createResponse(201, { 
      data: chat,
      message: 'Chat created successfully' 
    });

  } catch (error) {
    console.error('Error creating chat:', error);
    
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