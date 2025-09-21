import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, chatService } from '../../lib/common';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Get token from path parameters
    const token = event.pathParameters?.token;
    if (!token) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Token is required' 
      });
    }

    console.log(`Validating signin token: ${token}`);

    // Validate the token
    const tokenData = await chatService.validateSigninToken(token);
    
    if (!tokenData) {
      return createResponse(401, { 
        error: 'Unauthorized', 
        message: 'Invalid or expired token' 
      });
    }

    // Get user's paid chats only
    const userChats = await chatService.getUserChats(tokenData.email, 20, true);

    // If specific chat was requested, get its details and verify it's paid
    let specificChat = null;
    if (tokenData.chatId) {
      specificChat = await chatService.getChatById(tokenData.email, tokenData.chatId);
      
      // Verify the specific chat is paid
      if (specificChat && !specificChat.isPaid) {
        return createResponse(403, { 
          error: 'Forbidden', 
          message: 'Only paid conversations can be accessed via email signin' 
        });
      }
    }

    console.log(`Token validated successfully for email: ${tokenData.email}`);

    return createResponse(200, { 
      data: {
        email: tokenData.email,
        chatId: tokenData.chatId,
        chats: userChats.chats,
        specificChat,
        totalChats: userChats.total
      },
      message: 'Token validated successfully' 
    });

  } catch (error) {
    console.error('Error validating signin token:', error);
    
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
