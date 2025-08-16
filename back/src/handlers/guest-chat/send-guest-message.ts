import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, chatService } from '../../lib/common';
import { ChatSendMessageRequest } from '../../models/Chat';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Get chat ID from path parameters
    const chatId = event.pathParameters?.chatId;
    if (!chatId) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Chat ID is required' 
      });
    }

    // Parse request body
    let requestBody: ChatSendMessageRequest & { email?: string };
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Invalid JSON in request body' 
      });
    }

    // Optional email: if not provided we reject unless chat belongs to a generated guest id in DB
    const email = (requestBody.email || '').trim().toLowerCase();
    if (!email) {
      return createResponse(400, {
        error: 'Bad Request',
        message: 'Email or guest identifier is required'
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

    console.log(`Sending guest message for email: ${email}, chatId: ${chatId}`);

    // Verify chat exists and belongs to user (by email or guest id)
    const chat = await chatService.getChatById(email, chatId);
    if (!chat) {
      return createResponse(404, { 
        error: 'Not Found', 
        message: 'Chat not found or access denied' 
      });
    }

    // Send message and get AI response
    let result;
    try {
      result = await chatService.sendMessage(email, chatId, {
        content: requestBody.content.trim()
      });
    } catch (err) {
      if (err instanceof Error && /payment required/i.test(err.message)) {
        return createResponse(402, {
          error: 'Payment Required',
          message: 'Payment required to continue this conversation'
        });
      }
      throw err;
    }

    return createResponse(200, { 
      data: result,
      message: 'Message sent successfully' 
    });

  } catch (error) {
    console.error('Error sending guest message:', error);
    
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