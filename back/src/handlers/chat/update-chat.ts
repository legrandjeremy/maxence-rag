import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getEmailFromToken } from '../../lib/auth';
import { createResponse, chatService } from '../../lib/common';

interface UpdateChatRequest {
  title?: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Update chat request:', JSON.stringify(event, null, 2));

    // Extract user email from token
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
    let updateRequest: UpdateChatRequest;
    try {
      updateRequest = JSON.parse(event.body || '{}');
    } catch (error) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Invalid JSON in request body' 
      });
    }

    // Validate that at least one field is provided
    if (!updateRequest.title) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'At least one field (title) must be provided' 
      });
    }

    // Update the chat
    const updatedChat = await chatService.updateChat(chatId, userEmail, updateRequest);

    if (!updatedChat) {
      return createResponse(404, { 
        error: 'Not Found', 
        message: 'Chat not found or access denied' 
      });
    }

    return createResponse(200, {
      message: 'Chat updated successfully',
      data: updatedChat
    });

  } catch (error) {
    console.error('Error updating chat:', error);
    
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