import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/services/api';

export interface GuestChatMessage {
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

export interface GuestChat {
  id: string;
  userEmail: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
}

export interface GuestChatCreateRequest {
  email: string;
  title?: string;
}

export interface GuestChatSendMessageRequest {
  email: string;
  content: string;
}

export interface GuestChatHistoryResponse {
  messages: GuestChatMessage[];
  total: number;
  nextToken?: string;
}

export const useGuestChatStore = defineStore('guestChat', () => {
  // State
  const currentChat = ref<GuestChat | null>(null);
  const currentMessages = ref<GuestChatMessage[]>([]);
  const isLoading = ref(false);
  const isLoadingMessages = ref(false);
  const isSendingMessage = ref(false);
  const error = ref<string | null>(null);
  const userEmail = ref<string>('');

  // Computed
  const currentChatMessages = computed(() => {
    return [...currentMessages.value].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  });

  // Actions
  const clearError = () => {
    error.value = null;
  };

  const setUserEmail = (email: string) => {
    userEmail.value = email.trim().toLowerCase();
  };

  const createChat = async (request: GuestChatCreateRequest): Promise<boolean> => {
    try {
      isLoading.value = true;
      clearError();

      const response = await fetch(`${api.client.defaults.baseURL}/api/guest-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create chat');
      }

      const data = await response.json();
      currentChat.value = data.data;
      currentMessages.value = [];
      setUserEmail(request.email);

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create chat';
      console.error('Error creating guest chat:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const loadChatHistory = async (chatId: string, email: string): Promise<void> => {
    try {
      isLoadingMessages.value = true;
      clearError();

      const params = new URLSearchParams({
        email: email,
        limit: '50'
      });

      const response = await fetch(`${api.client.defaults.baseURL}/api/guest-chat/${chatId}/history?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load chat history');
      }

      const data = await response.json();
      currentMessages.value = data.data.messages || [];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load chat history';
      console.error('Error loading guest chat history:', err);
    } finally {
      isLoadingMessages.value = false;
    }
  };

  const sendMessage = async (chatId: string, content: string, email: string): Promise<boolean> => {
    if (!content.trim()) return false;

    // Optimistically add user's message
    const tempId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const tempUserMessage: GuestChatMessage = {
      id: tempId,
      chatId,
      userEmail: email,
      content: content.trim(),
      role: 'user',
      timestamp: nowIso,
    };
    currentMessages.value.push(tempUserMessage);

    try {
      isSendingMessage.value = true;
      clearError();

      const request: GuestChatSendMessageRequest = { 
        content: content.trim(),
        email: email
      };

      const response = await fetch(`${api.client.defaults.baseURL}/api/guest-chat/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      const data = await response.json();
      const { userMessage, assistantMessage } = data.data;

      // Replace temp user message with the persisted one
      const idx = currentMessages.value.findIndex(m => m.id === tempId);
      if (idx !== -1) {
        currentMessages.value[idx] = userMessage;
      } else {
        currentMessages.value.push(userMessage);
      }

      // Add assistant message
      currentMessages.value.push(assistantMessage);

      // Update the chat's lastMessageAt
      if (currentChat.value) {
        currentChat.value.lastMessageAt = assistantMessage.timestamp;
        currentChat.value.updatedAt = assistantMessage.timestamp;
      }

      return true;
    } catch (err) {
      // Remove temp message on failure
      currentMessages.value = currentMessages.value.filter(m => m.id !== tempId);
      error.value = err instanceof Error ? err.message : 'Failed to send message';
      console.error('Error sending guest message:', err);
      return false;
    } finally {
      isSendingMessage.value = false;
    }
  };

  const initializeGuestChat = async (email: string): Promise<boolean> => {
    if (!email.trim()) return false;
    
    setUserEmail(email);
    
    // Create a new chat for the guest user
    return await createChat({
      email: email,
      title: 'Consultation avec Luna'
    });
  };

  const reset = () => {
    currentChat.value = null;
    currentMessages.value = [];
    userEmail.value = '';
    error.value = null;
  };

  return {
    // State
    currentChat,
    currentMessages,
    isLoading,
    isLoadingMessages,
    isSendingMessage,
    error,
    userEmail,
    
    // Computed
    currentChatMessages,
    
    // Actions
    clearError,
    setUserEmail,
    createChat,
    loadChatHistory,
    sendMessage,
    initializeGuestChat,
    reset
  };
}); 