import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, chatService } from '../../lib/common';

interface SaveConversationRequest {
  email: string;
  lunaSessionId?: string; // This is the frontend Luna session ID (luna_xxx)
  databaseChatId?: string; // For continuing existing conversations
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    reasoning?: string;
  }>;
  title?: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parse request body
    let requestBody: SaveConversationRequest;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Invalid JSON in request body' 
      });
    }

    const { email, lunaSessionId, databaseChatId, messages, title } = requestBody;

    if (!email || !email.trim()) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Email is required' 
      });
    }

    // For new conversations, we don't require either ID - backend will generate one

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return createResponse(400, { 
        error: 'Bad Request', 
        message: 'Messages array is required and must not be empty' 
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

    console.log(`Saving Luna conversation for email: ${userEmail}, lunaSessionId: ${lunaSessionId}, databaseChatId: ${databaseChatId}`);

    let chat;
    
    if (databaseChatId) {
      // Continuing existing conversation - get chat by database ID
      chat = await chatService.getChatById(userEmail, databaseChatId);
      if (!chat) {
        return createResponse(404, { 
          error: 'Not Found', 
          message: 'Existing chat not found' 
        });
      }
      console.log(`Continuing existing chat: ${databaseChatId}`);
    } else if (lunaSessionId) {
      // Legacy Luna session - check if we already have a chat for this session
      chat = await chatService.getLunaChatBySessionId(userEmail, lunaSessionId);
      
      if (!chat) {
        // Create new chat for this Luna session
        chat = await chatService.createLunaChat(userEmail, lunaSessionId, {
          title: title || `Consultation Luna ${new Date().toLocaleDateString('fr-FR')}`
        });
        console.log(`Created new Luna chat: ${chat.id} for session: ${lunaSessionId}`);
      } else {
        console.log(`Found existing Luna chat: ${chat.id} for session: ${lunaSessionId}`);
      }
    } else {
      // New conversation - create new chat without Luna session ID
      chat = await chatService.createLunaChat(userEmail, undefined, {
        title: title || `Consultation Luna ${new Date().toLocaleDateString('fr-FR')}`
      });
      console.log(`Created new chat: ${chat.id} for new conversation`);
    }

    // Clear any existing messages for this chat to avoid duplicates
    await chatService.clearChatMessages(chat.id);

    // Save all messages with the correct user email and proper chat ID
    for (const message of messages) {
      await chatService.saveMessage(userEmail, chat.id, {
        content: message.content,
        role: message.role,
        timestamp: new Date(message.timestamp).toISOString(),
        metadata: message.reasoning ? { reasoning: message.reasoning } : undefined
      });
    }

    const sessionInfo = lunaSessionId ? `Luna session ${lunaSessionId}` : `database chat ${databaseChatId}`;
    console.log(`Successfully saved ${messages.length} messages for ${sessionInfo} as chat ${chat.id}`);

    return createResponse(200, { 
      data: { 
        chatId: chat.id, 
        lunaSessionId: lunaSessionId,
        databaseChatId: databaseChatId,
        messageCount: messages.length 
      },
      message: 'Luna conversation saved successfully' 
    });

  } catch (error) {
    console.error('Error saving Luna conversation:', error);
    
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
