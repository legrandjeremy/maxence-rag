export interface Chat {
  id: string;
  userEmail: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
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

export interface ChatCreateRequest {
  title?: string;
}

export interface ChatSendMessageRequest {
  content: string;
}

export interface ChatListResponse {
  chats: Chat[];
  total: number;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  total: number;
  nextToken?: string;
}

export interface BedrockResponse {
  content: string;
  sourceDocuments?: string[];
  confidence?: number;
}

export interface RAGContext {
  query: string;
  retrievedDocuments: Array<{
    content: string;
    source: string;
    score: number;
  }>;
} 