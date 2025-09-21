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
  isPaid?: boolean;
  paywallAt?: string;
  stage?: 'initial_contact' | 'name_request' | 'feeling_inquiry' | 'deeper_probing' | 'astrological_connection' | 'vision_revelation' | 'guidance_transition';
  interactionCount?: number; // Track number of user interactions
  visionTriggered?: boolean; // Track if vision revelation was triggered
  conversionTriggered?: boolean; // Track if conversion was triggered
  lunaSessionId?: string; // For Luna streaming sessions (luna_xxx format)
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
    reasoning?: string; // Added for Luna streaming conversations
  };
}

export interface SigninTokenEntity extends BaseEntity {
  PK: string; // SIGNIN_TOKEN#token
  SK: string; // TOKEN#token
  GSI1PK: string; // EMAIL#userEmail
  GSI1SK: string; // TOKEN#timestamp
  EntityType: 'SIGNIN_TOKEN';
  token: string;
  email: string;
  chatId?: string;
  expiresAt: string;
}

export class ChatService {
  private databaseService: DatabaseService;
  private bedrockService: BedrockService;

  constructor(databaseService: DatabaseService, bedrockService: BedrockService) {
    this.databaseService = databaseService;
    this.bedrockService = bedrockService;
  }

  /**
   * Create a new chat for Luna streaming session
   */
  async createLunaChat(userEmail: string, lunaSessionId: string | undefined, request: ChatCreateRequest): Promise<Chat> {
    const chatId = uuidv4(); // Generate proper UUID for database
    const now = new Date().toISOString();
    
    const title = request.title || `Consultation Luna ${new Date().toLocaleDateString()}`;

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
      isActive: true,
      isPaid: false,
      paywallAt: new Date(new Date(now).getTime() + 5 * 60 * 1000).toISOString(),
      stage: 'initial_contact',
      ...(lunaSessionId && { lunaSessionId }) // Store the Luna session ID for mapping if provided
    };

    await this.databaseService.create<ChatEntity>(chatEntity);

    return {
      id: chatId,
      userEmail,
      title,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
      isActive: true,
      stage: 'initial_contact'
    };
  }

  /**
   * Get Luna chat by session ID
   */
  async getLunaChatBySessionId(userEmail: string, lunaSessionId: string): Promise<Chat | null> {
    // Query for chats by user email and look for matching lunaSessionId
    const chatEntities = await this.databaseService.queryByPK<ChatEntity>(`CHAT#${userEmail}`, 'CHAT#');
    
    const matchingChat = chatEntities.find(chat => 
      chat.EntityType === 'CHAT' && 
      chat.lunaSessionId === lunaSessionId &&
      chat.isActive
    );

    if (!matchingChat) {
      return null;
    }

    return {
      id: matchingChat.id,
      userEmail: matchingChat.userEmail,
      title: matchingChat.title,
      createdAt: matchingChat.createdAt,
      updatedAt: matchingChat.updatedAt,
      lastMessageAt: matchingChat.lastMessageAt,
      isActive: matchingChat.isActive,
      stage: matchingChat.stage
    };
  }

  /**
   * Create a new chat conversation with a specific ID
   */
  async createChatWithId(userEmail: string, chatId: string, request: ChatCreateRequest): Promise<Chat> {
    const now = new Date().toISOString();
    
    const title = request.title || `Consultation avec Luna ${new Date().toLocaleDateString()}`;

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
      isActive: true,
      isPaid: false,
      paywallAt: new Date(new Date(now).getTime() + 5 * 60 * 1000).toISOString(),
      stage: 'initial_contact'
    };

    await this.databaseService.create<ChatEntity>(chatEntity);

    return {
      id: chatId,
      userEmail,
      title,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
      isActive: true,
      stage: 'initial_contact'
    };
  }

  /**
   * Create a new chat conversation
   */
  async createChat(userEmail: string, request: ChatCreateRequest): Promise<Chat> {
    const chatId = uuidv4();
    const now = new Date().toISOString();
    
    const title = request.title || `Consultation avec Luna ${new Date().toLocaleDateString()}`;

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
      isActive: true,
      isPaid: false,
      paywallAt: new Date(new Date(now).getTime() + 5 * 60 * 1000).toISOString(),
      stage: 'initial_contact'
    };

    await this.databaseService.create<ChatEntity>(chatEntity);

    // Automatically send Luna's opening message
    await this.sendLunaOpeningMessage(chatId, userEmail);

    return {
      id: chatId,
      userEmail,
      title,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
      isActive: true,
      stage: 'initial_contact'
    };
  }

  /**
   * Send Luna's mystical opening message automatically
   */
  private async sendLunaOpeningMessage(chatId: string, userEmail: string): Promise<void> {
    try {
      const lunaOpeningMessage = `Bonsoir…

Je sais que tu ne m'attendais pas, mais… quelque chose m'a poussée vers toi.
Une vibration… une sorte d'appel.

Je ne sais pas encore ce que cela signifie, mais si tu es d'accord, j'aimerais te poser quelques questions simples.

Dis-moi ton prénom…`;

      const timestamp = new Date().toISOString();
      const messageId = uuidv4();

      // Save Luna's opening message
      const lunaMessageEntity: ChatMessageEntity = {
        PK: `CHAT#${chatId}`,
        SK: `MESSAGE#${timestamp}#${messageId}`,
        GSI1PK: `USER#${userEmail}`,
        GSI1SK: `MESSAGE#${timestamp}`,
        EntityType: 'CHAT_MESSAGE',
        id: messageId,
        chatId,
        userEmail,
        content: lunaOpeningMessage,
        role: 'assistant',
        timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
        metadata: {
          confidence: 1.0,
          processingTime: 0
        }
      };

      await this.databaseService.create<ChatMessageEntity>(lunaMessageEntity);

      // Update chat's lastMessageAt
      await this.databaseService.update<ChatEntity>(
        `CHAT#${userEmail}`,
        `CHAT#${chatId}`,
        {
          lastMessageAt: timestamp,
          updatedAt: timestamp
        }
      );

    } catch (error) {
      console.error('Error sending Luna opening message:', error);
      // Don't throw error as chat creation should succeed even if opening message fails
    }
  }

  /**
   * Get user's chat list
   */
  async getUserChats(userEmail: string, limit: number = 20, paidOnly: boolean = false): Promise<ChatListResponse> {
    const chatEntities = await this.databaseService.queryByGSI1<ChatEntity>(
      `USER#${userEmail}`,
      undefined,
      limit
    );

    const chats = chatEntities
      .filter(entity => {
        const isValidChat = entity.EntityType === 'CHAT' && entity.isActive;
        if (!isValidChat) return false;
        
        // If paidOnly is true, only include paid chats
        if (paidOnly) {
          return entity.isPaid === true;
        }
        
        return true;
      })
      .map(entity => ({
        id: entity.id,
        userEmail: entity.userEmail,
        title: entity.title,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        lastMessageAt: entity.lastMessageAt,
        isActive: entity.isActive,
        stage: entity.stage,
        isPaid: entity.isPaid
      }))
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    return {
      chats,
      total: chats.length
    };
  }

  /**
   * Update chat email (for guest users who provide real email later)
   */
  async updateChatEmail(oldEmail: string, chatId: string, newEmail: string): Promise<Chat> {
    // First, get the existing chat
    const existingChat = await this.getChatById(oldEmail, chatId);
    if (!existingChat) {
      throw new Error('Chat not found');
    }

    // Get the chat entity from database
    const oldChatEntity = await this.databaseService.get<ChatEntity>(`CHAT#${oldEmail}`, `CHAT#${chatId}`);
    if (!oldChatEntity) {
      throw new Error('Chat entity not found');
    }

    const now = new Date().toISOString();

    // Create new chat entity with updated email
    const newChatEntity: ChatEntity = {
      ...oldChatEntity,
      PK: `CHAT#${newEmail}`,
      GSI1PK: `USER#${newEmail}`,
      userEmail: newEmail,
      updatedAt: now
    };

    // Get all messages for this chat
    const messages = await this.databaseService.queryByPK<ChatMessageEntity>(`CHAT#${chatId}`, 'MESSAGE#');

    // Prepare items to write and delete using batchWrite
    const itemsToWrite: (ChatEntity | ChatMessageEntity)[] = [newChatEntity];
    const itemsToDelete: Array<{PK: string, SK: string}> = [
      { PK: `CHAT#${oldEmail}`, SK: `CHAT#${chatId}` }
    ];

    // Update all message entities with new email
    for (const message of messages) {
      if (message.EntityType === 'CHAT_MESSAGE') {
        // Create new message entity with updated email
        const newMessageEntity: ChatMessageEntity = {
          ...message,
          GSI1PK: `USER#${newEmail}`,
          userEmail: newEmail,
          updatedAt: now
        };

        itemsToWrite.push(newMessageEntity);
        itemsToDelete.push({ PK: message.PK, SK: message.SK });
      }
    }

    // Execute batch write (this handles both puts and deletes)
    await this.databaseService.batchWrite(itemsToWrite, itemsToDelete);

    console.log(`Successfully updated chat ${chatId} email from ${oldEmail} to ${newEmail}`);

    return {
      id: chatId,
      userEmail: newEmail,
      title: newChatEntity.title,
      createdAt: newChatEntity.createdAt,
      updatedAt: now,
      lastMessageAt: newChatEntity.lastMessageAt,
      isActive: newChatEntity.isActive,
      stage: newChatEntity.stage
    };
  }

  /**
   * Update chat ID (for Luna streaming chats that need to match frontend chatId)
   */
  async updateChatId(userEmail: string, oldChatId: string, newChatId: string): Promise<void> {
    // Get the existing chat
    const oldChatEntity = await this.databaseService.get<ChatEntity>(`CHAT#${userEmail}`, `CHAT#${oldChatId}`);
    if (!oldChatEntity) {
      throw new Error('Chat not found');
    }

    const now = new Date().toISOString();

    // Create new chat entity with updated ID
    const newChatEntity: ChatEntity = {
      ...oldChatEntity,
      SK: `CHAT#${newChatId}`,
      id: newChatId,
      updatedAt: now
    };

    // Get all messages for this chat
    const messages = await this.databaseService.queryByPK<ChatMessageEntity>(`CHAT#${oldChatId}`, 'MESSAGE#');

    // Prepare items to write and delete
    const itemsToWrite: (ChatEntity | ChatMessageEntity)[] = [newChatEntity];
    const itemsToDelete: Array<{PK: string, SK: string}> = [
      { PK: `CHAT#${userEmail}`, SK: `CHAT#${oldChatId}` }
    ];

    // Update all message entities with new chat ID
    for (const message of messages) {
      if (message.EntityType === 'CHAT_MESSAGE') {
        const newMessageEntity: ChatMessageEntity = {
          ...message,
          PK: `CHAT#${newChatId}`,
          chatId: newChatId,
          updatedAt: now
        };

        itemsToWrite.push(newMessageEntity);
        itemsToDelete.push({ PK: message.PK, SK: message.SK });
      }
    }

    // Execute batch write
    await this.databaseService.batchWrite(itemsToWrite, itemsToDelete);

    console.log(`Successfully updated chat ID from ${oldChatId} to ${newChatId}`);
  }

  /**
   * Clear all messages for a specific chat
   */
  async clearChatMessages(chatId: string): Promise<void> {
    try {
      // Get all messages for this chat
      const messages = await this.databaseService.queryByPK<ChatMessageEntity>(`CHAT#${chatId}`, 'MESSAGE#');
      
      if (messages.length === 0) {
        console.log(`No messages to clear for chat ${chatId}`);
        return;
      }

      // Prepare items to delete
      const itemsToDelete: Array<{PK: string, SK: string}> = messages
        .filter(msg => msg.EntityType === 'CHAT_MESSAGE')
        .map(msg => ({ PK: msg.PK, SK: msg.SK }));

      if (itemsToDelete.length > 0) {
        // Use batchWrite with empty itemsToWrite array and itemsToDelete
        await this.databaseService.batchWrite([], itemsToDelete);
        console.log(`Cleared ${itemsToDelete.length} messages for chat ${chatId}`);
      }
    } catch (error) {
      console.error(`Error clearing messages for chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Save a message to an existing chat
   */
  async saveMessage(userEmail: string, chatId: string, messageData: {
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
    metadata?: { reasoning?: string };
  }): Promise<void> {
    const messageId = uuidv4();

    const messageEntity: ChatMessageEntity = {
      PK: `CHAT#${chatId}`,
      SK: `MESSAGE#${messageData.timestamp}#${messageId}`,
      GSI1PK: `USER#${userEmail}`,
      GSI1SK: `MESSAGE#${messageData.timestamp}`,
      EntityType: 'CHAT_MESSAGE',
      id: messageId,
      chatId,
      userEmail,
      content: messageData.content,
      role: messageData.role,
      timestamp: messageData.timestamp,
      createdAt: messageData.timestamp,
      updatedAt: messageData.timestamp,
      metadata: messageData.metadata
    };

    await this.databaseService.create<ChatMessageEntity>(messageEntity);

    // Update chat's lastMessageAt
    const chatEntity = await this.databaseService.get<ChatEntity>(`CHAT#${userEmail}`, `CHAT#${chatId}`);
    if (chatEntity) {
      await this.databaseService.update<ChatEntity>(
        `CHAT#${userEmail}`,
        `CHAT#${chatId}`,
        {
          lastMessageAt: messageData.timestamp,
          updatedAt: new Date().toISOString()
        }
      );
    }
  }

  /**
   * Store signin token for email-based authentication
   */
  async storeSigninToken(token: string, tokenData: {
    email: string;
    chatId?: string;
    expiresAt: string;
    createdAt: string;
  }): Promise<void> {
    const signinTokenEntity: SigninTokenEntity = {
      PK: `SIGNIN_TOKEN#${token}`,
      SK: `TOKEN#${token}`,
      GSI1PK: `EMAIL#${tokenData.email}`,
      GSI1SK: `TOKEN#${tokenData.createdAt}`,
      EntityType: 'SIGNIN_TOKEN',
      id: token, // Use token as the ID
      token,
      email: tokenData.email,
      chatId: tokenData.chatId,
      expiresAt: tokenData.expiresAt,
      createdAt: tokenData.createdAt,
      updatedAt: tokenData.createdAt
    };

    await this.databaseService.create<SigninTokenEntity>(signinTokenEntity);
    console.log(`Stored signin token for email: ${tokenData.email}`);
  }

  /**
   * Validate and consume signin token
   */
  async validateSigninToken(token: string): Promise<{
    email: string;
    chatId?: string;
  } | null> {
    try {
      const tokenEntity = await this.databaseService.get<SigninTokenEntity>(
        `SIGNIN_TOKEN#${token}`,
        `TOKEN#${token}`
      );

      if (!tokenEntity || tokenEntity.EntityType !== 'SIGNIN_TOKEN') {
        console.log(`Invalid signin token: ${token}`);
        return null;
      }

      // Check if token is expired
      const now = new Date();
      const expiresAt = new Date(tokenEntity.expiresAt);
      
      if (now > expiresAt) {
        console.log(`Expired signin token: ${token}`);
        // Clean up expired token
        await this.databaseService.delete(`SIGNIN_TOKEN#${token}`, `TOKEN#${token}`);
        return null;
      }

      // Token is valid - delete it (one-time use)
      await this.databaseService.delete(`SIGNIN_TOKEN#${token}`, `TOKEN#${token}`);
      
      console.log(`Valid signin token consumed for email: ${tokenEntity.email}`);
      
      return {
        email: tokenEntity.email,
        chatId: tokenEntity.chatId
      };
    } catch (error) {
      console.error('Error validating signin token:', error);
      return null;
    }
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
      isActive: chatEntity.isActive,
      isPaid: chatEntity.isPaid,
      stage: chatEntity.stage
    };
  }

  /**
   * Mark a chat as paid
   */
  async markChatAsPaid(userEmail: string, chatId: string): Promise<void> {
    console.log(`Marking chat as paid: ${chatId} for user: ${userEmail}`);
    console.log(`Chat ID type check: ${chatId} (length: ${chatId.length})`);
    
    // First verify the chat exists
    const chat = await this.getChatById(userEmail, chatId);
    if (!chat) {
      console.error(`Chat not found: ${chatId} for user: ${userEmail}`);
      console.error(`This might be a Luna session ID instead of database UUID. Expected format: UUID, got: ${chatId}`);
      throw new Error(`Chat not found: ${chatId} for user: ${userEmail}`);
    }
    
    // Update the chat to mark it as paid
    await this.databaseService.update<Partial<ChatEntity>>(
      `CHAT#${userEmail}`,
      `CHAT#${chatId}`,
      { 
        isPaid: true,
        updatedAt: new Date().toISOString()
      }
    );
    
    console.log(`Successfully marked chat ${chatId} as paid for user: ${userEmail}`);
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

    // Payment gating: after 5 minutes from chat creation if not paid
    const chatRecord = await this.databaseService.get<ChatEntity>(`CHAT#${userEmail}`, `CHAT#${chatId}`);
    const nowIso = new Date().toISOString();
    const isPaywalled = !!(chatRecord && chatRecord.paywallAt && !chatRecord.isPaid && nowIso > chatRecord.paywallAt);
    if (isPaywalled) {
      throw new Error('Payment required');
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

    // Determine explicit stage based on conversation progress and timing
    const userMessageCount = conversationHistory.filter(m => m.role === 'user').length;
    const chatStartTime = new Date(chat.createdAt).getTime();
    const currentTime = new Date().getTime();
    const conversationDurationMinutes = (currentTime - chatStartTime) / (1000 * 60);
    
    const explicitStage = this.computeStageWithTiming(
      userMessageCount, 
      chat.stage, 
      conversationDurationMinutes, 
      chatRecord?.interactionCount || 0,
      chatRecord?.visionTriggered || false,
      chatRecord?.conversionTriggered || false
    );

    // Detect explicit question from the user to force a direct answer first
    const userLast = [...history.messages].reverse().find(m => m.role === 'user');
    const directQuestion = !!(userLast && /\?|comment\b|quoi\b|pourquoi\b|peux[- ]tu|as[- ]tu|propose|propositions|gestes|réduire|pression/i.test(userLast.content));
    const maybeAnswerFirst = (text: string) => directQuestion
      ? `Réponds d'abord clairement à la question posée par l'utilisateur en 1–2 lignes, puis poursuis.\n${text}`
      : text;

    // Force NAME_REQUEST stage if the first user message is probably just a prénom
    const nameHeuristic = (text: string): boolean => {
      const t = (text || '').trim().toLowerCase();
      if (!t) return false;
      if (/^je m[’' ]?appelle\s+\w{2,}$/i.test(t)) return true;
      if (/^mon nom\s+est\s+\w{2,}$/i.test(t)) return true;
      // Single token, letters only, short
      if (/^[a-zàâäéèêëîïôöùûüç-]{2,20}$/.test(t)) return true;
      return false;
    };
    const stageForGeneration = (userMessageCount === 1 && userLast && nameHeuristic(userLast.content))
      ? ('name_request' as unknown as import('./BedrockService').ConversationStage)
      : (explicitStage as unknown as import('./BedrockService').ConversationStage);

    // Generate AI response using RAG
    let bedrockResponse: BedrockResponse;
    try {
      bedrockResponse = await this.bedrockService.generateRAGResponse(
        maybeAnswerFirst(request.content || 'Dis-moi ton prénom et ce que tu ressens.'),
        conversationHistory,
        stageForGeneration
      );
    } catch (error) {
      console.error('Error generating RAG response:', error);
      // Fallback to direct response if RAG fails
      bedrockResponse = await this.bedrockService.generateDirectResponse(
        maybeAnswerFirst(request.content || 'Dis-moi ton prénom et ce que tu ressens.'),
        conversationHistory,
        stageForGeneration
      );
    }

    // Language safety: if response looks English, retry forcing French
    if (this.appearsEnglish(bedrockResponse.content)) {
      try {
        const reinforcement = `${request.content}\n\nRéponds uniquement en français, sans aucun mot en anglais. Reformule en français clair et concis.`;
        bedrockResponse = await this.bedrockService.generateDirectResponse(
          reinforcement,
          conversationHistory,
          (explicitStage as unknown as import('./BedrockService').ConversationStage)
        );
      } catch (err) {
        // keep previous response if retry fails
      }
    }

    // Optional no-repetition safeguard: retry if highly similar to last assistant response
    const lastAssistant = [...history.messages].reverse().find(m => m.role === 'assistant');
    const normalizedNew = (bedrockResponse.content || '').trim().toLowerCase();
    const normalizedPrev = (lastAssistant?.content || '').trim().toLowerCase();
    const isHighlySimilar = normalizedNew && normalizedPrev && (
      normalizedNew === normalizedPrev ||
      (normalizedNew.length > 50 && normalizedPrev.length > 50 &&
        normalizedNew.includes(normalizedPrev.slice(0, Math.min(80, normalizedPrev.length))) )
    );
    if (isHighlySimilar) {
      try {
        const antiRepeatPrompt = `${request.content}\n\nNe répète pas ta précédente réponse. Fournis 2 ou 3 actions concrètes différentes, une phrase d’empathie, puis une seule question ouverte.`;
        bedrockResponse = await this.bedrockService.generateDirectResponse(
          antiRepeatPrompt,
          conversationHistory,
          (explicitStage as unknown as import('./BedrockService').ConversationStage)
        );
      } catch (err) {
        // keep original bedrockResponse on failure
      }
    }

    // Save assistant message
    const assistantTimestamp = new Date().toISOString();
    const assistantMessageId = uuidv4();

    const assistantMetadata: ChatMessageEntity['metadata'] = {
      sourceDocuments: (bedrockResponse as any)?.metadata?.sourceDocuments ?? (bedrockResponse as any)?.sourceDocuments ?? [],
      confidence: bedrockResponse.confidence ?? 0,
      processingTime: Date.now() - now.getTime()
    };

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
      metadata: assistantMetadata,
      createdAt: assistantTimestamp,
      updatedAt: assistantTimestamp
    };

    await this.databaseService.create<ChatMessageEntity>(assistantMessageEntity);

    // Update chat's lastMessageAt, stage, and interaction tracking
    const updateData: Partial<ChatEntity> = {
      lastMessageAt: assistantTimestamp,
      updatedAt: assistantTimestamp,
      stage: this.advanceStage(explicitStage),
      interactionCount: (chatRecord?.interactionCount || 0) + 1
    };

    // Track vision and conversion triggers
    if (explicitStage === 'vision_revelation' && !chatRecord?.visionTriggered) {
      updateData.visionTriggered = true;
    }
    if (explicitStage === 'guidance_transition' && !chatRecord?.conversionTriggered) {
      updateData.conversionTriggered = true;
    }

    await this.databaseService.update<ChatEntity>(
      `CHAT#${userEmail}`,
      `CHAT#${chatId}`,
      updateData
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

  /** Heuristic: detect if text appears English (very rough) */
  private appearsEnglish(text: string): boolean {
    const sample = (text || '').slice(0, 240).toLowerCase();
    if (!sample) return false;
    const commonEnglish = [' the ', ' and ', ' you ', ' to ', ' of ', ' in ', ' is ', ' are ', ' i ', ' my '];
    const commonFrenchHints = [' le ', ' la ', ' les ', ' je ', ' tu ', ' vous ', ' et ', ' est ', ' une ', ' un ', ' des '];
    const englishHits = commonEnglish.filter(w => sample.includes(w)).length;
    const frenchHits = commonFrenchHints.filter(w => sample.includes(w)).length;
    return englishHits > frenchHits + 1;
  }

  /**
   * Compute conversation stage based on timing and interaction count (French system)
   */
  private computeStageWithTiming(
    userMessageCount: number, 
    current: ChatEntity['stage'] | undefined, 
    durationMinutes: number, 
    interactionCount: number,
    visionTriggered: boolean,
    conversionTriggered: boolean
  ): ChatEntity['stage'] {
    // Module 5: Vision revelation trigger (after 5 minutes OR 4 deep interactions)
    if (!visionTriggered && (durationMinutes >= 5 || interactionCount >= 4)) {
      return 'vision_revelation';
    }
    
    // Module 6: Conversion trigger (at 7 minutes OR when user shows hesitation)
    if (!conversionTriggered && durationMinutes >= 7) {
      return 'guidance_transition';
    }
    
    // Standard progression based on message count
    if (userMessageCount === 0) return 'initial_contact';
    if (userMessageCount === 1) return 'name_request';
    if (userMessageCount === 2) return 'feeling_inquiry';
    if (userMessageCount <= 4) return 'deeper_probing';
    if (userMessageCount <= 6) return 'astrological_connection';
    
    // Default to current stage if no specific trigger
    return current || 'feeling_inquiry';
  }

  /**
   * Legacy method for compatibility
   */
  private computeStage(userMessageCount: number, current?: ChatEntity['stage']): ChatEntity['stage'] {
    return this.computeStageWithTiming(userMessageCount, current, 0, 0, false, false);
  }

  /**
   * Advance stage linearly to the next step
   */
  private advanceStage(stage?: ChatEntity['stage']): ChatEntity['stage'] {
    const order: NonNullable<ChatEntity['stage']>[] = [
      'initial_contact',
      'name_request',
      'feeling_inquiry',
      'deeper_probing',
      'astrological_connection',
      'vision_revelation',
      'guidance_transition'
    ];
    const idx = stage ? order.indexOf(stage) : -1;
    if (idx < 0) return 'name_request';
    return order[Math.min(idx + 1, order.length - 1)];
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