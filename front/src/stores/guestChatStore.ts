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
  const isAssistantTyping = ref(false);
  const error = ref<string | null>(null);
  const userEmail = ref<string>('');
  const conversationStartedAt = ref<number | null>(null);
  const isBlockedForPayment = ref(false);
  const isPaid = ref(false);
  const freeSecondsTotal = 7 * 60;
  const remainingSeconds = ref<number>(freeSecondsTotal);
  let timerId: number | null = null;

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
    // Persist user email for payment recovery
    if (userEmail.value) {
      localStorage.setItem('guestChat_userEmail', userEmail.value);
    }
  };

  const startConversationTimer = () => {
    if (!conversationStartedAt.value) {
      conversationStartedAt.value = Date.now();
      // Tick every second to update remaining
      const tick = () => {
        if (!conversationStartedAt.value) return;
        
        // If paid, stop the timer permanently
        if (isPaid.value) {
          if (timerId) {
            window.clearInterval(timerId);
            timerId = null;
          }
          return;
        }
        
        const elapsedSec = Math.floor((Date.now() - conversationStartedAt.value) / 1000);
        remainingSeconds.value = Math.max(0, freeSecondsTotal - elapsedSec);
        if (remainingSeconds.value <= 0 && !isPaid.value) {
          isBlockedForPayment.value = true;
          if (timerId) window.clearInterval(timerId);
        }
        
        // Every 30 seconds, check payment status to ensure sync with backend
        if (elapsedSec > 0 && elapsedSec % 30 === 0 && isBlockedForPayment.value && currentChat.value && userEmail.value) {
          void checkPaymentStatus(currentChat.value.id, userEmail.value);
        }
      };
      tick();
      timerId = window.setInterval(tick, 1000);
    }
  };

  const createChat = async (request: GuestChatCreateRequest): Promise<boolean> => {
    try {
      isLoading.value = true;
      clearError();

      const response = await api.post<GuestChat>('/api/guest-chat', request);
      currentChat.value = response.data.data as unknown as GuestChat;
      currentMessages.value = [];
      setUserEmail(request.email);
      
      // Persist chat info for payment recovery
      if (currentChat.value) {
        localStorage.setItem('guestChat_currentChat', JSON.stringify(currentChat.value));
      }
      
      // Load opening message from Luna immediately
      if (currentChat.value?.id) {
        await loadChatHistory(currentChat.value.id, request.email);
      }
      startConversationTimer();

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
    if (isBlockedForPayment.value && !isPaid.value) {
      error.value = 'La session gratuite est terminée. Veuillez régler 5 € pour continuer.';
      return false;
    }

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
      isAssistantTyping.value = true;

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
      isAssistantTyping.value = false;

      // Update the chat's lastMessageAt
      if (currentChat.value) {
        currentChat.value.lastMessageAt = assistantMessage.timestamp;
        currentChat.value.updatedAt = assistantMessage.timestamp;
      }

      return true;
    } catch (err) {
      isAssistantTyping.value = false;
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
      const baseChunk = 6;
      let pos = 0;
      const typeNext = () => {
        const remaining = finalAssistant.content.length - pos;
        const dynamicChunk = Math.min(baseChunk + Math.floor(pos / 120), 14);
        pos = Math.min(pos + Math.min(dynamicChunk, remaining), finalAssistant.content.length);
        const next = { ...currentMessages.value[index], content: finalAssistant.content.slice(0, pos), metadata: finalAssistant.metadata, timestamp: finalAssistant.timestamp } as GuestChatMessage;
        currentMessages.value.splice(index, 1, next);
        if (pos >= finalAssistant.content.length) {
          currentMessages.value.splice(index, 1, finalAssistant);
          resolve();
          return;
        }
        const lastChar = finalAssistant.content.charAt(pos - 1);
        const isPause = /[.,;!?\n]/.test(lastChar);
        const minDelay = isPause ? 120 : 45;
        const maxDelay = isPause ? 220 : 85;
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        window.setTimeout(typeNext, delay);
      };
      typeNext();
    });
  };

  const initializeGuestChat = async (email?: string): Promise<boolean> => {
    // Require real email - no anonymous chats
    if (!email || !email.trim()) {
      console.error('🚨 Guest Chat: Email is required - no anonymous chats allowed');
      return false;
    }
    
    const finalEmail = email.trim().toLowerCase();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(finalEmail)) {
      console.error('🚨 Guest Chat: Invalid email format');
      return false;
    }
    
    setUserEmail(finalEmail);
    return await createChat({
      email: finalEmail,
      title: 'Consultation avec Luna'
    });
  };

  // Removed generateAnonymousEmail() - no anonymous chats allowed

  const checkPaymentStatus = async (chatId: string, email: string): Promise<boolean> => {
    try {
      const response = await api.get<{ isPaid: boolean; paywallAt: string | null; lastMessageAt: string }>(
        `/api/guest-chat/${chatId}/status?email=${encodeURIComponent(email)}`
      );
      const status = response.data.data;
      
      // Update local state based on backend database state
      if (status.isPaid) {
        isPaid.value = true;
        isBlockedForPayment.value = false;
        // Stop the timer since payment is confirmed
        if (timerId) {
          window.clearInterval(timerId);
          timerId = null;
        }
        return true;
      }
      
      // Check if paywall time has passed and not paid
      if (status.paywallAt) {
        const now = new Date().toISOString();
        if (now > status.paywallAt && !status.isPaid) {
          isBlockedForPayment.value = true;
          return false;
        }
      }
      
      return status.isPaid;
    } catch (err) {
      console.error('Failed to check payment status', err);
      return false;
    }
  };

  const pollPaymentStatus = async (chatId: string, email: string, maxAttempts: number = 10): Promise<boolean> => {
    let attempts = 0;
    
    return new Promise((resolve) => {
      const poll = async () => {
        attempts++;
        const isPaid = await checkPaymentStatus(chatId, email);
        
        if (isPaid) {
          console.log('Payment confirmed after', attempts, 'attempts');
          resolve(true);
          return;
        }
        
        if (attempts >= maxAttempts) {
          console.log('Payment polling timeout after', attempts, 'attempts');
          resolve(false);
          return;
        }
        
        // Poll every 2 seconds
        setTimeout(() => { void poll(); }, 2000);
      };
      
      // Start polling immediately
      void poll();
    });
  };

  const recoverStateFromStorage = (): boolean => {
    try {
      // Try to recover currentChat from localStorage
      if (!currentChat.value) {
        const savedChat = localStorage.getItem('guestChat_currentChat');
        if (savedChat) {
          currentChat.value = JSON.parse(savedChat);
          console.log('Recovered currentChat from localStorage:', currentChat.value);
        }
      }
      
      // Try to recover userEmail from localStorage
      if (!userEmail.value) {
        const savedEmail = localStorage.getItem('guestChat_userEmail');
        if (savedEmail) {
          userEmail.value = savedEmail;
          console.log('Recovered userEmail from localStorage:', userEmail.value);
        }
      }
      
      return !!(currentChat.value && userEmail.value);
    } catch (err) {
      console.error('Error recovering state from localStorage:', err);
      return false;
    }
  };

  const handlePaymentSuccess = async (): Promise<void> => {
    console.log('handlePaymentSuccess');
    console.log('currentChat.value:', currentChat.value);
    console.log('userEmail.value:', userEmail.value);
    
    // Try to recover state from localStorage if missing
    if (!currentChat.value || !userEmail.value) {
      console.log('State missing, attempting recovery from localStorage...');
      const recovered = recoverStateFromStorage();
      
      if (!recovered) {
        console.warn('Cannot handle payment success: no current chat or user email (recovery failed)');
        error.value = 'Erreur: Session perdue. Veuillez actualiser la page et réessayer.';
        return;
      }
      
      console.log('State successfully recovered from localStorage');
    }

    try {
      console.log('Payment success message received, verifying with backend...');
      
      // Show verification message to user
      error.value = '✅ Paiement reçu ! Vérification en cours...';
      
      // Immediately check once  
      if (!currentChat.value?.id || !userEmail.value) {
        console.error('Missing chat or email for payment verification');
        return;
      }
      
      const isPaid = await checkPaymentStatus(currentChat.value.id, userEmail.value);
      
      if (isPaid) {
        console.log('Payment confirmed immediately');
        clearError();
        return;
      }
      
      // If not immediately confirmed, start polling
      console.log('Payment not immediately confirmed, starting polling...');
      error.value = '⏳ Confirmation du paiement en cours... Merci de patienter.';
      
      const confirmed = await pollPaymentStatus(currentChat.value.id, userEmail.value, 10);
      
      if (confirmed) {
        clearError();
        console.log('Payment successfully confirmed through polling');
      } else {
        console.warn('Payment confirmation timeout - please try again');
        error.value = '⚠️ Vérification du paiement en cours... Veuillez patienter ou actualiser la page si le problème persiste.';
      }
    } catch (err) {
      console.error('Error handling payment success:', err);
      error.value = 'Erreur lors de la vérification du paiement. Veuillez actualiser la page.';
    }
  };

  const clearUserData = () => {
    // Clear localStorage data
    localStorage.removeItem('guestChat_currentChat');
    localStorage.removeItem('guestChat_userEmail');
    console.log('User data cleared from localStorage');
  };

  const reset = () => {
    currentChat.value = null;
    currentMessages.value = [];
    userEmail.value = '';
    error.value = null;
    conversationStartedAt.value = null;
    isBlockedForPayment.value = false;
    isPaid.value = false;
    remainingSeconds.value = freeSecondsTotal;
    if (timerId) window.clearInterval(timerId);
    timerId = null;
    
    // Clear localStorage
    clearUserData();
  };

  return {
    // State
    currentChat,
    currentMessages,
    isLoading,
    isLoadingMessages,
    isSendingMessage,
    error,
    isAssistantTyping,
    userEmail,
    conversationStartedAt,
    isBlockedForPayment,
    isPaid,
    remainingSeconds,
    
    // Computed
    currentChatMessages,
    
    // Actions
    clearError,
    setUserEmail,
    createChat,
    loadChatHistory,
    sendMessage,
    initializeGuestChat,
    startConversationTimer,
    checkPaymentStatus,
    pollPaymentStatus,
    handlePaymentSuccess,
    recoverStateFromStorage,
    clearUserData,
    reset
  };
}); 