import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, chatService } from '../../lib/common';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    let requestBody: { email: string; chatId: string };
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      return createResponse(400, { error: 'Bad Request', message: 'Invalid JSON in request body' });
    }

    const { email, chatId } = requestBody;

    if (!email || !email.trim() || !chatId || !chatId.trim()) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Email and chatId are required' 
      });
    }

    const userEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Invalid email format' 
      });
    }

    console.log(`Manually marking chat as paid: ${chatId} for user: ${userEmail}`);

    // Mark the chat as paid using ChatService
    await chatService.markChatAsPaid(userEmail, chatId);

    console.log(`Successfully marked chat ${chatId} as paid for user: ${userEmail}`);

    return createResponse(200, { 
      data: {
        chatId,
        email: userEmail,
        isPaid: true
      },
      message: 'Chat marked as paid successfully' 
    });

  } catch (error) {
    console.error('Error marking chat as paid:', error);
    if (error instanceof Error) {
      if (error.message.includes('Chat not found')) {
        return createResponse(404, { error: 'Not Found', message: error.message });
      }
      return createResponse(500, { error: 'Internal Server Error', message: error.message });
    }
    return createResponse(500, { error: 'Internal Server Error', message: 'An unexpected error occurred' });
  }
};
