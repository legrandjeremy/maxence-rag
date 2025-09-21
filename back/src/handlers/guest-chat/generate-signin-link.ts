import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, chatService } from '../../lib/common';
import { v4 as uuidv4 } from 'uuid';

interface GenerateSigninLinkRequest {
  email: string;
  chatId?: string; // Optional - if provided, creates direct link to specific chat
}

interface SigninToken {
  token: string;
  email: string;
  chatId?: string;
  expiresAt: string;
  createdAt: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parse request body
    let requestBody: GenerateSigninLinkRequest;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Invalid JSON in request body' 
      });
    }

    const { email, chatId } = requestBody;

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

    console.log(`Generating signin link for email: ${userEmail}, chatId: ${chatId || 'none'}`);

    // Check if user has any chats
    const userChats = await chatService.getUserChats(userEmail, 10);
    if (!userChats.chats || userChats.chats.length === 0) {
      return createResponse(404, { 
        error: 'Not Found', 
        message: 'No conversations found for this email address' 
      });
    }

    // If specific chatId provided, verify it belongs to the user
    if (chatId) {
      const specificChat = await chatService.getChatById(userEmail, chatId);
      if (!specificChat) {
        return createResponse(404, { 
          error: 'Not Found', 
          message: 'Chat not found or access denied' 
        });
      }
    }

    // Generate secure signin token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    const createdAt = new Date().toISOString();

    // Store signin token in database (using chat service for now, could be separate table)
    const signinTokenData: SigninToken = {
      token,
      email: userEmail,
      chatId,
      expiresAt,
      createdAt
    };

    // Store token temporarily (you might want to create a dedicated table for this)
    await chatService.storeSigninToken(token, signinTokenData);

    // Generate signin URL
    const baseUrl = process.env.CLOUDFRONT_DOMAIN || 'https://your-domain.com';
    const signinUrl = chatId 
      ? `${baseUrl}/luna?token=${token}&chat=${chatId}`
      : `${baseUrl}/luna?token=${token}`;

    console.log(`Generated signin link for ${userEmail}: ${signinUrl}`);

    return createResponse(200, { 
      data: {
        signinUrl,
        token,
        expiresAt,
        chatCount: userChats.chats.length,
        specificChat: chatId ? userChats.chats.find(c => c.id === chatId) : null
      },
      message: 'Signin link generated successfully' 
    });

  } catch (error) {
    console.error('Error generating signin link:', error);
    
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
