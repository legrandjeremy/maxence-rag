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
  stage?: 'initial_contact' | 'name_request' | 'feeling_inquiry' | 'deeper_probing' | 'astrological_connection' | 'vision_revelation' | 'guidance_transition';
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
      if (err instanceof Error && /chat not found|access denied/i.test(err.message)) {
        error.value = "La conversation n'est plus disponible.";
      } else {
        error.value = err instanceof Error ? err.message : 'Failed to load chat history';
      }
      console.error('Error loading chat history:', err);
    } finally {
      isLoadingMessages.value = false;
    }
  };

  // Streaming-capable send message: optimistic user message + fetch assistant progressively when supported
  const sendMessage = async (chatId: string, content: string): Promise<boolean> => {
    if (!content.trim()) return false;

    try {
      isSendingMessage.value = true;
      clearError();

      const trimmed = content.trim();
      const request: ChatSendMessageRequest = { content: trimmed };

      // Optimistically append the user's message for immediate UX
      const optimisticUser: ChatMessage = {
        id: `local-${Date.now()}`,
        chatId,
        userEmail: '',
        content: trimmed,
        role: 'user',
        timestamp: new Date().toISOString(),
      };
      currentMessages.value.push(optimisticUser);

      // Prepare placeholder assistant for streaming effect
      const placeholderAssistant: ChatMessage = {
        id: `local-assistant-${Date.now()}`,
        chatId,
        userEmail: '',
        content: '',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
      currentMessages.value.push(placeholderAssistant);

      // Standard POST to get final assistant message
      const response = await api.post<{
        userMessage: ChatMessage;
        assistantMessage: ChatMessage;
      }>(`/api/chats/${chatId}/messages`, request);

      // Replace optimistic user with server one (keep order)
      const idx = currentMessages.value.findIndex(m => m.id === optimisticUser.id);
      if (idx !== -1) {
        currentMessages.value.splice(idx, 1, response.data.data.userMessage);
      } else {
        currentMessages.value.push(response.data.data.userMessage);
      }
      // Gradually reveal assistant content
      await revealAssistantMessageGradually(placeholderAssistant.id, response.data.data.assistantMessage);

      // Update the chat's lastMessageAt
      const chatIndex = chats.value.findIndex(c => c.id === chatId);
      if (chatIndex !== -1) {
        const chat = chats.value[chatIndex];
        if (chat) {
          const ts = response.data.data.assistantMessage.timestamp;
          chat.lastMessageAt = ts;
          chat.updatedAt = ts;
        }
      }

      return true;
    } catch (err) {
      if (err instanceof Error && /chat not found|access denied/i.test(err.message)) {
        error.value = "La conversation n'est plus disponible.";
      } else {
        error.value = err instanceof Error ? err.message : 'Failed to send message';
      }
      console.error('Error sending message:', err);
      return false;
    } finally {
      isSendingMessage.value = false;
    }
  };

  // Helpers
  const revealAssistantMessageGradually = async (placeholderId: string, finalAssistant: ChatMessage) => {
    return new Promise<void>((resolve) => {
      const index = currentMessages.value.findIndex(m => m.id === placeholderId);
      if (index === -1) {
        currentMessages.value.push(finalAssistant);
        resolve();
        return;
      }
      const chunkSize = 24;
      const minDelay = 15;
      const maxDelay = 35;
      let pos = 0;
      const timer = () => {
        pos = Math.min(pos + chunkSize, finalAssistant.content.length);
        const next = { ...currentMessages.value[index], content: finalAssistant.content.slice(0, pos), metadata: finalAssistant.metadata, timestamp: finalAssistant.timestamp };
        currentMessages.value.splice(index, 1, next);
        if (pos >= finalAssistant.content.length) {
          // Replace with the real message id to avoid local ids lingering
          currentMessages.value.splice(index, 1, finalAssistant);
          resolve();
          return;
        }
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        window.setTimeout(timer, delay);
      };
      timer();
    });
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