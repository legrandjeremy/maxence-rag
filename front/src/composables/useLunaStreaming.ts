import { ref, reactive, computed } from 'vue';
import type { LunaStreamingRequest } from '../services/lunaWebSocketService';
import { 
  lunaWebSocketService
  // LunaStreamingStatus  // Commented out - not used in this file
} from '../services/lunaWebSocketService';

export interface LunaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  reasoning?: string;
  isStreaming?: boolean;
  isComplete?: boolean;
  tokens?: {
    input: number;
    output: number;
  };
  price?: number;
}

export interface LunaStreamingState {
  isConnected: boolean;
  isStreaming: boolean;
  isReasoning: boolean;
  currentMessage: string;
  currentReasoning: string;
  error: string | null;
  success: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export function useLunaStreaming() {
  // Reactive state
  const state = reactive<LunaStreamingState>({
    isConnected: false,
    isStreaming: false,
    isReasoning: false,
    currentMessage: '',
    currentReasoning: '',
    error: null,
    success: null,
    connectionStatus: 'disconnected'
  });

  const messages = ref<LunaMessage[]>([]);
  const conversationHistory = ref<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // 🚀 Timer and Payment State (inspired by GuestChatWidget)
  const conversationStartedAt = ref<number | null>(null);
  const isBlockedForPayment = ref(false);
  const isPaid = ref(false);
  const freeSecondsTotal = 5 * 60; // 5 minutes free trial
  const remainingSeconds = ref<number>(freeSecondsTotal);
  let timerId: number | null = null;

  // 🚀 Payment form state (embedded Stripe form)
  const showPaymentForm = ref(false);

  // 🚀 Load payment state from localStorage (no session recovery)
  const loadPaymentState = () => {
    try {
      const savedPaymentState = localStorage.getItem('luna_payment_state');
      if (savedPaymentState) {
        const state = JSON.parse(savedPaymentState);
        if (state.isPaid && state.email) {
          console.log('🌙 Luna: Restored payment state for:', state.email);
          isPaid.value = true;
          isBlockedForPayment.value = false;
        }
      }

      const savedTimerState = localStorage.getItem('luna_timer_state');
      if (savedTimerState) {
        const timerState = JSON.parse(savedTimerState);
        if (timerState.startedAt && !isPaid.value) {
          conversationStartedAt.value = timerState.startedAt;
          const elapsed = Math.floor((Date.now() - timerState.startedAt) / 1000);
          remainingSeconds.value = Math.max(0, freeSecondsTotal - elapsed);
          
          if (remainingSeconds.value <= 0) {
            isBlockedForPayment.value = true;
          }
        }
      }
    } catch (error) {
      console.error('🚨 Luna: Error loading payment state:', error);
    }
  };

  // 🚀 Save payment state to localStorage
  const savePaymentState = () => {
    try {
      const userEmail = localStorage.getItem('guestChat_userEmail') || localStorage.getItem('luna_guest_email');
      if (userEmail) {
        localStorage.setItem('luna_payment_state', JSON.stringify({
          isPaid: isPaid.value,
          email: userEmail,
          timestamp: Date.now()
        }));
      }

      if (conversationStartedAt.value) {
        localStorage.setItem('luna_timer_state', JSON.stringify({
          startedAt: conversationStartedAt.value,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('🚨 Luna: Error saving payment state:', error);
    }
  };

  // Computed properties
  const canSendMessage = computed(() => 
    state.connectionStatus === 'connected' && 
    !state.isStreaming && 
    (!isBlockedForPayment.value || isPaid.value) // 🚀 Block if payment required
  );

  const isProcessing = computed(() => 
    state.isStreaming || state.isReasoning
  );

  const hasError = computed(() => 
    state.error !== null
  );

  const hasSuccess = computed(() => 
    state.success !== null
  );

  // 🚀 Timer computed properties
  const formattedRemaining = computed(() => {
    const secs = remainingSeconds.value;
    const mm = Math.floor(secs / 60).toString().padStart(2, '0');
    const ss = Math.floor(secs % 60).toString().padStart(2, '0');
    return `Temps gratuit: ${mm}:${ss}`;
  });

  const shouldShowTimer = computed(() => 
    !isPaid.value && 
    !isBlockedForPayment.value && 
    conversationStartedAt.value !== null
  );

  const shouldShowPaymentBanner = computed(() => 
    isBlockedForPayment.value && !isPaid.value
  );

  // Generate unique message ID (using simple timestamp-based ID)
  const generateMessageId = (): string => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // 🚀 Filter out Luna's staging directions during streaming
  const filterStagingDirections = (content: string): string => {
    const stagingDirections = [
      'pause',
      'silence profond',
      'silence',
      'respire profondément',
      'ferme les yeux',
      'médite',
      'se concentre',
      'souffle mystique',
      'énergie vibrante',
      'aura dorée',
      'lumière blanche'
    ];
    
    let filtered = content;
    
    // Remove staging directions (case insensitive)
    stagingDirections.forEach(direction => {
      const regex = new RegExp(`\\*\\s*${direction}\\s*\\*`, 'gi');
      filtered = filtered.replace(regex, '').trim();
    });
    
    // Clean up extra spaces
    return filtered.replace(/\s+/g, ' ').trim();
  };

  // Add user message to conversation
  const addUserMessage = (content: string): LunaMessage => {
    const message: LunaMessage = {
      id: generateMessageId(),
      role: 'user',
      content,
      timestamp: Date.now(),
      isComplete: true
    };

    messages.value.push(message);
    conversationHistory.value.push({ role: 'user', content });
    
    console.log('👤 User message added:', content.substring(0, 50) + '...');
    return message;
  };

  // Add assistant message (for streaming)
  const addAssistantMessage = (initialContent: string = ''): LunaMessage => {
    const message: LunaMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: initialContent,
      timestamp: Date.now(),
      reasoning: '',
      isStreaming: true,
      isComplete: false
    };

    messages.value.push(message);
    return message;
  };

  // Update the last assistant message
  const updateLastAssistantMessage = (
    content: string, 
    reasoning?: string, 
    isComplete: boolean = false,
    tokens?: { input: number; output: number },
    price?: number
  ) => {
    const lastMessage = messages.value[messages.value.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      lastMessage.content = content;
      if (reasoning !== undefined) {
        lastMessage.reasoning = reasoning;
      }
      lastMessage.isStreaming = !isComplete;
      lastMessage.isComplete = isComplete;
      if (tokens) {
        lastMessage.tokens = tokens;
      }
      if (price !== undefined) {
        lastMessage.price = price;
      }

      // Update conversation history when complete
      if (isComplete) {
        const historyEntry = conversationHistory.value.find(
          h => h.role === 'assistant' && h.content === ''
        );
        if (historyEntry) {
          historyEntry.content = content;
        } else {
          conversationHistory.value.push({ role: 'assistant', content });
        }
      }
    }
  };

  // Clear error state
  const clearError = () => {
    state.error = null;
  };

  // Clear success state
  const clearSuccess = () => {
    state.success = null;
  };

  // 🚀 Timer and Payment Functions (inspired by GuestChatWidget)
  const startConversationTimer = () => {
    if (!conversationStartedAt.value && !isPaid.value) {
      conversationStartedAt.value = Date.now();
      savePaymentState(); // Save initial timer state
      
      // Tick every second to update remaining time
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
        
        // Save state every 10 seconds
        if (elapsedSec > 0 && elapsedSec % 10 === 0) {
          savePaymentState();
        }
        
        if (remainingSeconds.value <= 0 && !isPaid.value) {
          console.log('🌙 Luna: Free time expired, blocking for payment');
          isBlockedForPayment.value = true;
          savePaymentState();
          if (timerId) {
            window.clearInterval(timerId);
            timerId = null;
          }
        }
      };
      
      tick();
      timerId = window.setInterval(tick, 1000);
    }
  };

  const openPayment = () => {
    console.log('🌙 Luna: Opening embedded Stripe payment form for €9');
    showPaymentForm.value = true;
  };

  // 🚀 Close payment form
  const closePaymentForm = () => {
    showPaymentForm.value = false;
    console.log('🌙 Luna: Payment form closed');
  };

  const handlePaymentSuccess = () => {
    console.log('🌙 Luna: Payment successful, removing restrictions');
    isPaid.value = true;
    isBlockedForPayment.value = false;
    
    // 🚀 Close payment form
    closePaymentForm();
    
    // Stop the timer since payment is confirmed
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
    
    // Save payment state immediately
    savePaymentState();
    
    // Clear any payment error messages
    state.error = null;
    
    // Show success message briefly
    state.success = '✨ Paiement réussi ! Votre consultation avec Luna peut continuer librement.';
    setTimeout(() => {
      if (state.success?.includes('Paiement réussi')) {
        state.success = null;
      }
    }, 3000);
    
    console.log('🌙 Luna: Chat fully unlocked, ready for unlimited consultation');
  };

  // 🚀 Handle payment error
  const handlePaymentError = (error: string) => {
    console.error('🚨 Luna: Payment error:', error);
    state.error = `Erreur de paiement: ${error}`;
    // Keep payment form open for retry
  };

  // 🚀 Check URL for payment success/cancel (legacy support)
  const checkPaymentFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      console.log('🌙 Luna: Payment success detected from URL');
      handlePaymentSuccess();
      
      // Clean up URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete('payment');
      window.history.replaceState({}, '', url.toString());
    } else if (paymentStatus === 'cancel') {
      console.log('🌙 Luna: Payment cancelled');
      closePaymentForm(); // Close form on cancel
      state.error = 'Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.';
      
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('payment');
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Reset conversation
  const resetConversation = () => {
    messages.value = [];
    conversationHistory.value = [];
    state.currentMessage = '';
    state.currentReasoning = '';
    state.error = null;
    state.isStreaming = false;
    state.isReasoning = false;
    console.log('🔄 Luna conversation reset');
  };

  // Send message to Luna with streaming
  const sendMessageToLuna = async (
    content: string,
    options: {
      useReasoning?: boolean;
      enableKnowledge?: boolean;
      userEmail: string;
      chatId?: string;
    }
  ): Promise<void> => {
    try {
      console.log('🌙 Sending message to Luna:', content.substring(0, 50) + '...');
      
      // 🚀 Check if blocked for payment
      if (isBlockedForPayment.value && !isPaid.value) {
        state.error = 'La session gratuite est terminée. Veuillez régler 9 € pour continuer.';
        return;
      }
      
      // 🚀 Start timer on first message
      if (!conversationStartedAt.value) {
        startConversationTimer();
      }
      
      // Clear any previous errors
      clearError();
      
      // 🚀 DUPLICATION FIX: Add user message to UI immediately (but not to conversationHistory for backend)
      addUserMessage(content);
      
      // Get customer info for personalized responses
      let customerInfo = null;
      try {
        const customerInfoStr = localStorage.getItem('luna_customer_info');
        if (customerInfoStr) {
          customerInfo = JSON.parse(customerInfoStr);
          console.log('🌙 Luna: Including customer info for personalized response:', {
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            email: customerInfo.email,
            birthDate: customerInfo.birthDate
          });
        } else {
          console.warn('🚨 Luna: No customer info found in localStorage - Luna may ask for basic information');
        }
      } catch (error) {
        console.error('🚨 Luna: Error parsing customer info:', error);
      }

      // Prepare streaming request with CURRENT conversationHistory (excludes the message we just added)
      const request: LunaStreamingRequest = {
        content,
        conversationHistory: conversationHistory.value.slice(0, -1), // Exclude the message we just added
        userEmail: options.userEmail,
        ...(options.chatId && { chatId: options.chatId }),
        useReasoning: options.useReasoning || false,
        enableKnowledge: options.enableKnowledge !== false, // Default to true
        ...(customerInfo && { customerInfo })
      };

      // Set initial state (keep connected status to reassure customer)
      // Don't change connectionStatus to 'connecting' during streaming
      if (state.connectionStatus === 'disconnected' || state.connectionStatus === 'error') {
        state.connectionStatus = 'connecting';
      }
      // Keep 'connected' status during streaming to reassure customer
      
      state.isStreaming = true;
      state.isReasoning = options.useReasoning || false;
      state.currentMessage = '';
      state.currentReasoning = '';

      // Add placeholder assistant message
      addAssistantMessage();

      // Set up streaming callbacks
      await lunaWebSocketService.sendStreamingMessage(request, {
        onStream: (token: string) => {
          state.currentMessage += token;
          // 🚀 Filter staging directions from streaming content
          const filteredMessage = filterStagingDirections(state.currentMessage);
          updateLastAssistantMessage(filteredMessage, state.currentReasoning);
        },

        onReasoning: (reasoning: string) => {
          state.currentReasoning += reasoning;
          // 🚀 Filter staging directions from reasoning content
          const filteredReasoning = filterStagingDirections(state.currentReasoning);
          const filteredMessage = filterStagingDirections(state.currentMessage);
          updateLastAssistantMessage(filteredMessage, filteredReasoning);
        },

        onComplete: (result) => {
          console.log('✨ Luna response complete:', {
            completion: result.completion.substring(0, 50) + '...',
            tokens: result.token_count,
            price: `$${result.price.toFixed(4)}`
          });

          // 🚀 User message already in UI, just finalize the assistant response

          // 🚀 Filter staging directions from final completion
          const filteredCompletion = filterStagingDirections(result.completion);
          const filteredReasoning = filterStagingDirections(state.currentReasoning);

          // Final update to message
          updateLastAssistantMessage(
            filteredCompletion,
            filteredReasoning,
            true,
            result.token_count,
            result.price
          );

          // Reset streaming state
          state.isStreaming = false;
          state.isReasoning = false;
          state.connectionStatus = 'connected';
          state.currentMessage = '';
          state.currentReasoning = '';

          // 🚀 Auto-save conversation to database after each message
          // Only save if user has provided real email (not anonymous)
          const userEmail = localStorage.getItem('guestChat_userEmail');
          const hasRealEmail = userEmail && !userEmail.includes('@guest.luna') && userEmail !== 'anonymous';
          
          if (options.chatId && hasRealEmail) {
            setTimeout(() => {
              void saveConversationToDatabase(options.chatId);
            }, 1000); // Small delay to ensure UI is updated
          } else {
            console.log('🌙 Luna: Skipping auto-save - no real email provided yet');
          }
        },

        onError: (error: string) => {
          console.error('🚨 Luna streaming error:', error);
          
          // 🚀 User message already in UI, just handle the error
          
          state.error = error;
          state.isStreaming = false;
          state.isReasoning = false;
          state.connectionStatus = 'error';
          
          // Mark last message as failed
          const lastMessage = messages.value[messages.value.length - 1];
          if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
            lastMessage.isStreaming = false;
            lastMessage.isComplete = false;
            lastMessage.content = '✨ Luna s\'excuse, une perturbation mystique s\'est produite...';
          }
        }
      });

    } catch (error) {
      console.error('🚨 Failed to send message to Luna:', error);
      state.error = error instanceof Error ? error.message : 'Erreur de connexion avec Luna';
      state.isStreaming = false;
      state.isReasoning = false;
      state.connectionStatus = 'error';
    }
  };

  // Disconnect from Luna
  const disconnect = () => {
    lunaWebSocketService.disconnect();
    state.connectionStatus = 'disconnected';
    state.isStreaming = false;
    state.isReasoning = false;
    console.log('🌙 Disconnected from Luna');
  };

  // Check connection status
  const checkConnection = () => {
    const isConnected = lunaWebSocketService.isConnected();
    state.isConnected = isConnected;
    if (isConnected && state.connectionStatus !== 'connected') {
      state.connectionStatus = 'connected';
    }
    return isConnected;
  };

  // Test WebSocket connection
  const testConnection = async (userEmail?: string): Promise<boolean> => {
    try {
      state.connectionStatus = 'connecting';
      const result = await lunaWebSocketService.testConnection(userEmail);
      
      if (result.isConnected) {
        state.connectionStatus = 'connected';
        state.isConnected = true;
        console.log('✅ Luna WebSocket: Connection test successful');
        return true;
      } else {
        state.connectionStatus = 'error';
        state.isConnected = false;
        state.error = result.error || 'Connection failed';
        console.error('🚨 Luna WebSocket: Connection test failed:', result.error);
        return false;
      }
    } catch (error) {
      state.connectionStatus = 'error';
      state.isConnected = false;
      state.error = error instanceof Error ? error.message : 'Connection test failed';
      console.error('🚨 Luna WebSocket: Connection test error:', error);
      return false;
    }
  };

  // Get conversation summary for storage
  const getConversationSummary = () => {
    return {
      messages: messages.value.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        reasoning: m.reasoning
      })),
      totalMessages: messages.value.length,
      lastActivity: messages.value.length > 0 ? 
        Math.max(...messages.value.map(m => m.timestamp)) : null
    };
  };

  // Load conversation from storage
  const loadConversation = (data: {
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: number;
      reasoning?: string;
    }>;
  }) => {
    resetConversation();
    
    data.messages.forEach(msg => {
      const message: LunaMessage = {
        id: generateMessageId(),
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        ...(msg.reasoning && { reasoning: msg.reasoning }),
        isComplete: true,
        isStreaming: false
      };
      
      messages.value.push(message);
      conversationHistory.value.push({
        role: msg.role,
        content: msg.content
      });
    });

    console.log(`🔄 Loaded ${data.messages.length} messages from storage`);
  };

  // 🚀 Save conversation to database for persistence
  const saveConversationToDatabase = async (chatId?: string) => {
    const userEmail = localStorage.getItem('guestChat_userEmail');
    
    // Only save if user has provided real email (not anonymous)
    const hasRealEmail = userEmail && !userEmail.includes('@guest.luna') && userEmail !== 'anonymous';
    
    if (!hasRealEmail || !chatId || messages.value.length === 0) {
      console.log('🌙 Luna: Skipping database save - no real email provided yet');
      return; // Skip if no real email, chatId, or messages
    }

    try {
      // Check if we're continuing an existing conversation
      const databaseChatId = localStorage.getItem('luna_database_chat_id');
      const storedSessionId = localStorage.getItem('luna_current_session_id');
      
      const conversationData: {
        email: string;
        messages: Array<{
          role: 'user' | 'assistant';
          content: string;
          timestamp: number;
          reasoning?: string;
        }>;
        title: string;
        databaseChatId?: string;
        lunaSessionId?: string;
      } = {
        email: userEmail,
        messages: messages.value.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          ...(msg.reasoning && { reasoning: msg.reasoning })
        })),
        title: `Consultation Luna ${new Date().toLocaleDateString('fr-FR')}`
      };

      if (databaseChatId) {
        // Continuing existing conversation
        conversationData.databaseChatId = databaseChatId;
        console.log('🌙 Luna: Saving to existing database chat:', databaseChatId);
      } else {
        // New conversation - let backend generate the chat ID
        // Don't use Luna session IDs anymore
        console.log('🌙 Luna: Creating new conversation - backend will generate chat ID');
      }

      // Import api dynamically to avoid circular dependencies
      const { api } = await import('../services/api');
      const response = await api.post('/api/guest-chat/save-conversation', conversationData);
      
      // Store the database chatId returned from the API
      if (response.data?.data?.chatId) {
        localStorage.setItem('luna_database_chat_id', response.data.data.chatId);
        console.log('🌙 Luna: Stored database chatId:', response.data.data.chatId);
      }
      
      console.log('🌙 Luna: Conversation auto-saved to database');
    } catch (error) {
      console.error('🚨 Luna: Error auto-saving conversation:', error);
    }
  };

  return {
    // State
    state,
    messages,
    conversationHistory,
    
    // Computed
    canSendMessage,
    isProcessing,
    hasError,
    hasSuccess,
    formattedRemaining,
    shouldShowTimer,
    shouldShowPaymentBanner,
    
    // Timer & Payment State
    conversationStartedAt,
    isBlockedForPayment,
    isPaid,
    remainingSeconds,
    showPaymentForm,
    
    // Methods
    sendMessageToLuna,
    addUserMessage,
    clearError,
    clearSuccess,
    resetConversation,
    disconnect,
    checkConnection,
    testConnection,
    getConversationSummary,
    startConversationTimer,
    openPayment,
    closePaymentForm,
    handlePaymentSuccess,
    handlePaymentError,
    loadConversation,
    saveConversationToDatabase,
    loadPaymentState,
    savePaymentState,
    checkPaymentFromURL
  };
};

// 🚀 Initialize payment state when composable is imported
// This ensures state is loaded as soon as the composable is used

// 🚀 Session cleanup handler - clears session data when tab/window is closed
export const setupLunaPageCloseHandler = () => {
  const handleBeforeUnload = (_event: BeforeUnloadEvent) => {
    console.log('🌙 Luna: Before unload event - clearing session data', _event);
    // Clear all session data when tab/window is closed
    // Users can now retrieve their chats via email
    try {
      // Clear Luna-specific session data
      localStorage.removeItem('guestChat_userEmail');
      localStorage.removeItem('luna_customer_info');
      localStorage.removeItem('luna_payment_state');
      localStorage.removeItem('luna_session_backup');
      localStorage.removeItem('luna_current_session_id');
      localStorage.removeItem('luna_database_chat_id');
      localStorage.removeItem('luna_conversations');
      localStorage.removeItem('luna_settings');
      localStorage.removeItem('guestChat_currentChat');
      localStorage.removeItem('luna_timer_state');
      
      console.log('🌙 Luna: Session data cleared - users can retrieve chats via email');
    } catch (error) {
      console.error('🚨 Luna: Error clearing session data:', error);
    }
    
    // No longer clear data or show confirmation dialog
    // Let users refresh/navigate freely while preserving their session
  };

  // Add event listener for backup only
  window.addEventListener('beforeunload', handleBeforeUnload);

  // Return cleanup function
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
};
