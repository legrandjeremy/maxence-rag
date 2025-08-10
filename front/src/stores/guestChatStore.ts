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

      const response = await api.post<GuestChat>('/api/guest-chat', request);
      currentChat.value = response.data.data as unknown as GuestChat;
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

      const response = await api.get<GuestChatHistoryResponse>(`/api/guest-chat/${chatId}/history?email=${encodeURIComponent(email)}&limit=50`);
      currentMessages.value = (response.data.data as unknown as GuestChatHistoryResponse).messages || [];
    } catch (err) {
      if (err instanceof Error && /chat not found|access denied/i.test(err.message)) {
        error.value = "La conversation n'est plus disponible.";
      } else {
        error.value = err instanceof Error ? err.message : 'Failed to load chat history';
      }
      console.error('Error loading guest chat history:', err);
    } finally {
      isLoadingMessages.value = false;
    }
  };

  const sendMessage = async (chatId: string, content: string, email: string): Promise<boolean> => {
    if (!content.trim()) return false;

    try {
      isSendingMessage.value = true;
      clearError();

      const trimmed = content.trim();
      const request: GuestChatSendMessageRequest = { 
        content: trimmed,
        email: email
      };

      // Optimistic user message
      const optimisticUser: GuestChatMessage = {
        id: `local-${Date.now()}`,
        chatId,
        userEmail: email,
        content: trimmed,
        role: 'user',
        timestamp: new Date().toISOString()
      };
      currentMessages.value.push(optimisticUser);

      // Placeholder assistant for progressive reveal
      const placeholderAssistant: GuestChatMessage = {
        id: `local-assistant-${Date.now()}`,
        chatId,
        userEmail: email,
        content: '',
        role: 'assistant',
        timestamp: new Date().toISOString()
      };
      currentMessages.value.push(placeholderAssistant);

      const response = await api.post<{ userMessage: GuestChatMessage; assistantMessage: GuestChatMessage }>(`/api/guest-chat/${chatId}/messages`, request);
      const { userMessage, assistantMessage } = response.data.data as { userMessage: GuestChatMessage; assistantMessage: GuestChatMessage };

      // Replace optimistic user with server one
      const idx = currentMessages.value.findIndex(m => m.id === optimisticUser.id);
      if (idx !== -1) {
        currentMessages.value.splice(idx, 1, userMessage);
      } else {
        currentMessages.value.push(userMessage);
      }
      // Reveal assistant message progressively
      await revealAssistantMessageGradually(placeholderAssistant.id, assistantMessage);

      // Update the chat's lastMessageAt
      if (currentChat.value) {
        currentChat.value.lastMessageAt = assistantMessage.timestamp;
        currentChat.value.updatedAt = assistantMessage.timestamp;
      }

      return true;
    } catch (err) {
      if (err instanceof Error && /chat not found|access denied/i.test(err.message)) {
        error.value = "La conversation n'est plus disponible.";
      } else {
        error.value = err instanceof Error ? err.message : 'Failed to send message';
      }
      console.error('Error sending guest message:', err);
      return false;
    } finally {
      isSendingMessage.value = false;
    }
  };

  const revealAssistantMessageGradually = async (placeholderId: string, finalAssistant: GuestChatMessage) => {
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
        const next = { ...currentMessages.value[index], content: finalAssistant.content.slice(0, pos), metadata: finalAssistant.metadata, timestamp: finalAssistant.timestamp } as GuestChatMessage;
        currentMessages.value.splice(index, 1, next);
        if (pos >= finalAssistant.content.length) {
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