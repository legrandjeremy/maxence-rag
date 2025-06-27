import { DatabaseService, BaseEntity } from './DatabaseService';
import { BedrockService } from './BedrockService';
import { 
  Chat, 
  ChatMessage, 
  ChatCreateRequest, 
  ChatSendMessageRequest, 
  ChatListResponse, 
  ChatHistoryResponse,
  BedrockResponse 
} from '../models/Chat';
import { v4 as uuidv4 } from 'uuid';

// DynamoDB entities for single table design
export interface ChatEntity extends BaseEntity {
  PK: string; // CHAT#userEmail
  SK: string; // CHAT#chatId
  GSI1PK: string; // USER#userEmail
  GSI1SK: string; // CHAT#timestamp
  EntityType: 'CHAT';
  userEmail: string;
  title: string;
  lastMessageAt: string;
  isActive: boolean;
}

export interface ChatMessageEntity extends BaseEntity {
  PK: string; // CHAT#chatId
  SK: string; // MESSAGE#timestamp#messageId
  GSI1PK: string; // USER#userEmail
  GSI1SK: string; // MESSAGE#timestamp
  EntityType: 'CHAT_MESSAGE';
  chatId: string;
  userEmail: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  metadata?: {
    sourceDocuments?: string[];
    confidence?: number;
    processingTime?: number;
  };
}

export class ChatService {
  private databaseService: DatabaseService;
  private bedrockService: BedrockService;

  constructor(databaseService: DatabaseService, bedrockService: BedrockService) {
    this.databaseService = databaseService;
    this.bedrockService = bedrockService;
  }

  /**
   * Create a new chat conversation
   */
  async createChat(userEmail: string, request: ChatCreateRequest): Promise<Chat> {
    const chatId = uuidv4();
    const now = new Date().toISOString();
    
    const title = request.title || `Chat ${new Date().toLocaleDateString()}`;

    const chatEntity: ChatEntity = {
      PK: `CHAT#${userEmail}`,
      SK: `CHAT#${chatId}`,
      GSI1PK: `USER#${userEmail}`,
      GSI1SK: `CHAT#${now}`,
      EntityType: 'CHAT',
      id: chatId,
      userEmail,
      title,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
      isActive: true
    };

    await this.databaseService.create<ChatEntity>(chatEntity);

    return {
      id: chatId,
      userEmail,
      title,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
      isActive: true
    };
  }

  /**
   * Get user's chat list
   */
  async getUserChats(userEmail: string, limit: number = 20): Promise<ChatListResponse> {
    const chatEntities = await this.databaseService.queryByGSI1<ChatEntity>(
      `USER#${userEmail}`,
      undefined,
      limit
    );

    const chats = chatEntities
      .filter(entity => entity.EntityType === 'CHAT' && entity.isActive)
      .map(entity => ({
        id: entity.id,
        userEmail: entity.userEmail,
        title: entity.title,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        lastMessageAt: entity.lastMessageAt,
        isActive: entity.isActive
      }))
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    return {
      chats,
      total: chats.length
    };
  }

  /**
   * Get chat by ID
   */
  async getChatById(userEmail: string, chatId: string): Promise<Chat | null> {
    const chatEntity = await this.databaseService.get<ChatEntity>(
      `CHAT#${userEmail}`,
      `CHAT#${chatId}`
    );

    if (!chatEntity || !chatEntity.isActive) {
      return null;
    }

    return {
      id: chatEntity.id,
      userEmail: chatEntity.userEmail,
      title: chatEntity.title,
      createdAt: chatEntity.createdAt,
      updatedAt: chatEntity.updatedAt,
      lastMessageAt: chatEntity.lastMessageAt,
      isActive: chatEntity.isActive
    };
  }

  /**
   * Get chat history (messages)
   */
  async getChatHistory(chatId: string, limit: number = 50): Promise<ChatHistoryResponse> {
    const messageEntities = await this.databaseService.queryByPK<ChatMessageEntity>(
      `CHAT#${chatId}`,
      'MESSAGE#',
      limit
    );

    const messages = messageEntities
      .filter(entity => entity.EntityType === 'CHAT_MESSAGE')
      .map(entity => ({
        id: entity.id,
        chatId: entity.chatId,
        userEmail: entity.userEmail,
        content: entity.content,
        role: entity.role,
        timestamp: entity.timestamp,
        metadata: entity.metadata
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      messages,
      total: messages.length
    };
  }

  /**
   * Send message and get AI response
   */
  async sendMessage(
    userEmail: string, 
    chatId: string, 
    request: ChatSendMessageRequest
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
    // Verify chat exists and belongs to user
    const chat = await this.getChatById(userEmail, chatId);
    if (!chat) {
      throw new Error('Chat not found or access denied');
    }

    const now = new Date();
    const timestamp = now.toISOString();
    const userMessageId = uuidv4();

    // Save user message
    const userMessageEntity: ChatMessageEntity = {
      PK: `CHAT#${chatId}`,
      SK: `MESSAGE#${timestamp}#${userMessageId}`,
      GSI1PK: `USER#${userEmail}`,
      GSI1SK: `MESSAGE#${timestamp}`,
      EntityType: 'CHAT_MESSAGE',
      id: userMessageId,
      chatId,
      userEmail,
      content: request.content,
      role: 'user',
      timestamp,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await this.databaseService.create<ChatMessageEntity>(userMessageEntity);

    // Get conversation history for context
    const history = await this.getChatHistory(chatId, 10);
    const conversationHistory = history.messages
      .slice(-10) // Keep last 10 messages for context
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // Generate AI response using RAG
    let bedrockResponse: BedrockResponse;
    try {
      bedrockResponse = await this.bedrockService.generateRAGResponse(
        request.content,
        conversationHistory
      );
    } catch (error) {
      console.error('Error generating RAG response:', error);
      // Fallback to direct response if RAG fails
      bedrockResponse = await this.bedrockService.generateDirectResponse(
        request.content,
        conversationHistory
      );
    }

    // Save assistant message
    const assistantTimestamp = new Date().toISOString();
    const assistantMessageId = uuidv4();

    const assistantMessageEntity: ChatMessageEntity = {
      PK: `CHAT#${chatId}`,
      SK: `MESSAGE#${assistantTimestamp}#${assistantMessageId}`,
      GSI1PK: `USER#${userEmail}`,
      GSI1SK: `MESSAGE#${assistantTimestamp}`,
      EntityType: 'CHAT_MESSAGE',
      id: assistantMessageId,
      chatId,
      userEmail,
      content: bedrockResponse.content,
      role: 'assistant',
      timestamp: assistantTimestamp,
      metadata: {
        sourceDocuments: bedrockResponse.sourceDocuments,
        confidence: bedrockResponse.confidence,
        processingTime: Date.now() - now.getTime()
      },
      createdAt: assistantTimestamp,
      updatedAt: assistantTimestamp
    };

    await this.databaseService.create<ChatMessageEntity>(assistantMessageEntity);

    // Update chat's lastMessageAt
    await this.databaseService.update<ChatEntity>(
      `CHAT#${userEmail}`,
      `CHAT#${chatId}`,
      {
        lastMessageAt: assistantTimestamp,
        updatedAt: assistantTimestamp
      }
    );

    return {
      userMessage: {
        id: userMessageId,
        chatId,
        userEmail,
        content: request.content,
        role: 'user',
        timestamp
      },
      assistantMessage: {
        id: assistantMessageId,
        chatId,
        userEmail,
        content: bedrockResponse.content,
        role: 'assistant',
        timestamp: assistantTimestamp,
        metadata: assistantMessageEntity.metadata
      }
    };
  }

  /**
   * Delete a chat (soft delete)
   */
  async deleteChat(userEmail: string, chatId: string): Promise<void> {
    const chat = await this.getChatById(userEmail, chatId);
    if (!chat) {
      throw new Error('Chat not found or access denied');
    }

    await this.databaseService.update<ChatEntity>(
      `CHAT#${userEmail}`,
      `CHAT#${chatId}`,
      {
        isActive: false,
        updatedAt: new Date().toISOString()
      }
    );
  }

  /**
   * Update chat
   */
  async updateChat(chatId: string, userEmail: string, updates: { title?: string }): Promise<Chat | null> {
    const chat = await this.getChatById(userEmail, chatId);
    if (!chat) {
      return null;
    }

    const updateData: Partial<ChatEntity> = {
      updatedAt: new Date().toISOString()
    };

    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }

    const updatedEntity = await this.databaseService.update<ChatEntity>(
      `CHAT#${userEmail}`,
      `CHAT#${chatId}`,
      updateData
    );

    return {
      id: updatedEntity.id,
      userEmail: updatedEntity.userEmail,
      title: updatedEntity.title,
      createdAt: updatedEntity.createdAt,
      updatedAt: updatedEntity.updatedAt,
      lastMessageAt: updatedEntity.lastMessageAt,
      isActive: updatedEntity.isActive
    };
  }

  /**
   * Update chat title
   */
  async updateChatTitle(userEmail: string, chatId: string, title: string): Promise<Chat> {
    const chat = await this.getChatById(userEmail, chatId);
    if (!chat) {
      throw new Error('Chat not found or access denied');
    }

    const updatedEntity = await this.databaseService.update<ChatEntity>(
      `CHAT#${userEmail}`,
      `CHAT#${chatId}`,
      {
        title,
        updatedAt: new Date().toISOString()
      }
    );

    return {
      id: updatedEntity.id,
      userEmail: updatedEntity.userEmail,
      title: updatedEntity.title,
      createdAt: updatedEntity.createdAt,
      updatedAt: updatedEntity.updatedAt,
      lastMessageAt: updatedEntity.lastMessageAt,
      isActive: updatedEntity.isActive
    };
  }

  /**
   * Health check for chat service
   */
  async healthCheck(): Promise<{ database: boolean; bedrock: boolean }> {
    try {
      const bedrockHealth = await this.bedrockService.healthCheck();
      return {
        database: true, // DatabaseService doesn't have explicit health check
        bedrock: bedrockHealth
      };
    } catch (error) {
      console.error('Chat service health check failed:', error);
      return {
        database: false,
        bedrock: false
      };
    }
  }
} 