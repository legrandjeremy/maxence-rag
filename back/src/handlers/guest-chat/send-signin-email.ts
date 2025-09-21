import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, chatService } from '../../lib/common';
import { EmailService } from '../../lib/EmailService';
import { v4 as uuidv4 } from 'uuid';

interface SendSigninEmailRequest {
  email: string;
  chatId?: string; // Optional - if provided, creates direct link to specific chat
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parse request body
    let requestBody: SendSigninEmailRequest;
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

    console.log(`Sending signin email to: ${userEmail}, chatId: ${chatId || 'none'}`);

    // Check if user has any paid chats
    const userChats = await chatService.getUserChats(userEmail, 10, true);
    if (!userChats.chats || userChats.chats.length === 0) {
      return createResponse(404, { 
        error: 'Not Found', 
        message: 'No paid conversations found for this email address' 
      });
    }

    // If specific chatId provided, verify it belongs to the user and is paid
    let specificChat = null;
    if (chatId) {
      specificChat = await chatService.getChatById(userEmail, chatId);
      if (!specificChat) {
        return createResponse(404, { 
          error: 'Not Found', 
          message: 'Chat not found or access denied' 
        });
      }
      
      // Check if the specific chat is paid
      if (!specificChat.isPaid) {
        return createResponse(403, { 
          error: 'Forbidden', 
          message: 'Only paid conversations can be accessed via email signin' 
        });
      }
    }

    const baseUrl = process.env.CLOUDFRONT_DOMAIN || 'https://your-domain.com';
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    const createdAt = new Date().toISOString();

    // Generate tokens for all chats
    const chatTokens = [];
    for (const chat of userChats.chats) {
      const token = uuidv4();
      
      // Store signin token in database
      await chatService.storeSigninToken(token, {
        email: userEmail,
        chatId: chat.id,
        expiresAt,
        createdAt
      });

      chatTokens.push({
        id: chat.id,
        title: chat.title,
        lastMessageAt: chat.lastMessageAt,
        signinUrl: `${baseUrl}/welcome.html?token=${token}&chat=${chat.id}`
      });
    }

    // Generate general signin token (for new session)
    const generalToken = uuidv4();
    await chatService.storeSigninToken(generalToken, {
      email: userEmail,
      chatId: undefined,
      expiresAt,
      createdAt
    });

    const generalSigninUrl = `${baseUrl}/welcome.html?token=${generalToken}`;

    // Send email using SES
    const emailService = new EmailService();
    const emailSent = await emailService.sendSigninEmail({
      userEmail,
      signinUrl: generalSigninUrl, // Fallback general link
      chatCount: userChats.chats.length,
      specificChatTitle: specificChat?.title,
      expiresAt,
      chats: chatTokens // All chats with individual links
    });

    if (!emailSent) {
      return createResponse(500, { 
        error: 'Internal Server Error', 
        message: 'Failed to send signin email' 
      });
    }

    console.log(`Signin email sent successfully to ${userEmail}`);

    return createResponse(200, { 
      data: {
        emailSent: true,
        expiresAt,
        chatCount: userChats.chats.length,
        specificChat: specificChat ? {
          id: specificChat.id,
          title: specificChat.title
        } : null
      },
      message: 'Signin email sent successfully' 
    });

  } catch (error) {
    console.error('Error sending signin email:', error);
    
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
