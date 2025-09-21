import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, chatService } from '../../lib/common';
import { ChatCreateRequest } from '../../models/Chat';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parse request body
    let requestBody: ChatCreateRequest & { email?: string };
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Invalid JSON in request body' 
      });
    }

    // Require real email - no anonymous chats allowed
    const email = (requestBody.email || '').trim().toLowerCase();
    
    if (!email) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Email is required - no anonymous chats allowed' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Valid email format is required' 
      });
    }

    console.log(`Creating guest chat for email: ${email}`);

    // Create new chat using real email only
    const chat = await chatService.createChat(email, {
      title: requestBody.title || 'Consultation avec Luna'
    });

    return createResponse(201, { 
      data: chat,
      message: 'Guest chat created successfully' 
    });

  } catch (error) {
    console.error('Error creating guest chat:', error);
    
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

// Removed generateGuestEmail() - no anonymous chats allowed