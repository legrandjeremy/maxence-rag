import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, chatService } from '../../lib/common';

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
    let requestBody: { oldEmail: string; newEmail: string };
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Invalid JSON in request body' 
      });
    }

    const oldEmail = (requestBody.oldEmail || '').trim().toLowerCase();
    const newEmail = (requestBody.newEmail || '').trim().toLowerCase();

    if (!oldEmail || !newEmail) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Both oldEmail and newEmail are required' 
      });
    }

    // Validate new email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Invalid email format for newEmail' 
      });
    }

    console.log(`Updating guest chat email from ${oldEmail} to ${newEmail} for chatId: ${chatId}`);

    // Verify chat exists with old email
    const chat = await chatService.getChatById(oldEmail, chatId);
    if (!chat) {
      return createResponse(404, { 
        error: 'Not Found', 
        message: 'Chat not found with the provided oldEmail' 
      });
    }

    // Update the chat's email
    const updatedChat = await chatService.updateChatEmail(oldEmail, chatId, newEmail);

    return createResponse(200, { 
      data: updatedChat,
      message: 'Chat email updated successfully' 
    });

  } catch (error) {
    console.error('Error updating guest chat email:', error);
    
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
