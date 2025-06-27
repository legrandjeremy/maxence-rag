import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/services/api';

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

export interface Chat {
  id: string;
  userEmail: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  isActive: boolean;
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

export const useChatStore = defineStore('chat', () => {
  // State
  const chats = ref<Chat[]>([]);
  const currentChat = ref<Chat | null>(null);
  const currentMessages = ref<ChatMessage[]>([]);
  const isLoading = ref(false);
  const isLoadingChats = ref(false);
  const isLoadingMessages = ref(false);
  const isSendingMessage = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const sortedChats = computed(() => {
    return [...chats.value].sort((a, b) => 
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  });

  const hasChats = computed(() => chats.value.length > 0);

  const currentChatMessages = computed(() => {
    return [...currentMessages.value].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  });

  // Actions
  const clearError = () => {
    error.value = null;
  };

  const setCurrentChat = (chat: Chat | null) => {
    currentChat.value = chat;
    if (chat) {
      void loadChatHistory(chat.id);
    } else {
      currentMessages.value = [];
    }
  };

  const loadChats = async (): Promise<void> => {
    try {
      isLoadingChats.value = true;
      clearError();

      const response = await api.get<ChatListResponse>('/api/chats');
      chats.value = response.data.data.chats;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load chats';
      console.error('Error loading chats:', err);
    } finally {
      isLoadingChats.value = false;
    }
  };

  const createChat = async (request: ChatCreateRequest = {}): Promise<Chat | null> => {
    try {
      isLoading.value = true;
      clearError();

      const response = await api.post<Chat>('/api/chats', request);
      const newChat = response.data.data;
      
      chats.value.unshift(newChat);
      setCurrentChat(newChat);
      
      return newChat;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create chat';
      console.error('Error creating chat:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const loadChatHistory = async (chatId: string): Promise<void> => {
    try {
      isLoadingMessages.value = true;
      clearError();

      const response = await api.get<ChatHistoryResponse>(`/api/chats/${chatId}/messages`);
      currentMessages.value = response.data.data.messages;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load chat history';
      console.error('Error loading chat history:', err);
    } finally {
      isLoadingMessages.value = false;
    }
  };

  const sendMessage = async (chatId: string, content: string): Promise<boolean> => {
    if (!content.trim()) return false;

    try {
      isSendingMessage.value = true;
      clearError();

      const request: ChatSendMessageRequest = { content: content.trim() };
      const response = await api.post<{
        userMessage: ChatMessage;
        assistantMessage: ChatMessage;
      }>(`/api/chats/${chatId}/messages`, request);

      const { userMessage, assistantMessage } = response.data.data;
      
      // Add both messages to current messages
      currentMessages.value.push(userMessage, assistantMessage);

      // Update the chat's lastMessageAt
      const chatIndex = chats.value.findIndex(c => c.id === chatId);
      if (chatIndex !== -1) {
        const chat = chats.value[chatIndex];
        if (chat) {
          chat.lastMessageAt = assistantMessage.timestamp;
          chat.updatedAt = assistantMessage.timestamp;
        }
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send message';
      console.error('Error sending message:', err);
      return false;
    } finally {
      isSendingMessage.value = false;
    }
  };

  const deleteChat = async (chatId: string): Promise<boolean> => {
    try {
      isLoading.value = true;
      clearError();

      await api.delete(`/api/chats/${chatId}`);
      
      // Remove chat from list
      chats.value = chats.value.filter(c => c.id !== chatId);
      
      // Clear current chat if it was the deleted one
      if (currentChat.value?.id === chatId) {
        setCurrentChat(null);
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete chat';
      console.error('Error deleting chat:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const updateChatTitle = async (chatId: string, title: string): Promise<boolean> => {
    try {
      isLoading.value = true;
      clearError();

      const response = await api.put<Chat>(`/api/chats/${chatId}`, { title });
      const updatedChat = response.data.data;
      
      // Update chat in list
      const chatIndex = chats.value.findIndex(c => c.id === chatId);
      if (chatIndex !== -1) {
        chats.value[chatIndex] = updatedChat;
      }

      // Update current chat if it's the updated one
      if (currentChat.value?.id === chatId) {
        currentChat.value = updatedChat;
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update chat title';
      console.error('Error updating chat title:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const clearCurrentChat = () => {
    setCurrentChat(null);
  };

  const reset = () => {
    chats.value = [];
    currentChat.value = null;
    currentMessages.value = [];
    isLoading.value = false;
    isLoadingChats.value = false;
    isLoadingMessages.value = false;
    isSendingMessage.value = false;
    error.value = null;
  };

  return {
    // State
    chats: sortedChats,
    currentChat,
    currentMessages: currentChatMessages,
    isLoading,
    isLoadingChats,
    isLoadingMessages,
    isSendingMessage,
    error,

    // Computed
    hasChats,

    // Actions
    clearError,
    setCurrentChat,
    loadChats,
    createChat,
    loadChatHistory,
    sendMessage,
    deleteChat,
    updateChatTitle,
    clearCurrentChat,
    reset
  };
}); 