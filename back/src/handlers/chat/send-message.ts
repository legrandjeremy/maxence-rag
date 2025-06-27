import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, chatService } from '../../lib/common';
import { getEmailFromToken } from '../../lib/auth';
import { ChatSendMessageRequest } from '../../models/Chat';

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

    // Parse request body
    let requestBody: ChatSendMessageRequest;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Invalid JSON in request body' 
      });
    }

    // Validate message content
    if (!requestBody.content || requestBody.content.trim().length === 0) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Message content is required' 
      });
    }

    if (requestBody.content.length > 4000) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Message content exceeds maximum length of 4000 characters' 
      });
    }

    // Send message and get AI response
    const result = await chatService.sendMessage(userEmail, chatId, {
      content: requestBody.content.trim()
    });

    return createResponse(200, { 
      data: result,
      message: 'Message sent successfully' 
    });

  } catch (error) {
    console.error('Error sending message:', error);
    
    if (error instanceof Error) {
      // Handle specific error cases
      if (error.message === 'Chat not found or access denied') {
        return createResponse(404, { 
          error: 'Not Found', 
          message: error.message 
        });
      }

      if (error.message.includes('Failed to generate response')) {
        return createResponse(503, { 
          error: 'Service Unavailable', 
          message: 'AI service is currently unavailable. Please try again later.' 
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