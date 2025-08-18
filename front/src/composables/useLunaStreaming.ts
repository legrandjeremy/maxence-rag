import { ref, reactive, computed } from 'vue';
import type { LunaStreamingRequest } from '../services/lunaWebSocketService';
import { 
  lunaWebSocketService
  // LunaStreamingStatus  // Commented out - not used in this file
} from '../services/lunaWebSocketService';
import { useAuthStore } from '../stores/authStore'; // 🚀 For payment integration

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
    connectionStatus: 'disconnected'
  });

  const messages = ref<LunaMessage[]>([]);
  const conversationHistory = ref<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // 🚀 Timer and Payment State (inspired by GuestChatWidget)
  const conversationStartedAt = ref<number | null>(null);
  const isBlockedForPayment = ref(false);
  const isPaid = ref(false);
  const freeSecondsTotal = 1 * 60; // 1 minute free trial
  const remainingSeconds = ref<number>(freeSecondsTotal);
  let timerId: number | null = null;

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

  // Generate unique message ID
  const generateMessageId = (): string => {
    return `luna_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  // 🚀 Timer and Payment Functions (inspired by GuestChatWidget)
  const startConversationTimer = () => {
    if (!conversationStartedAt.value) {
      conversationStartedAt.value = Date.now();
      console.log('🌙 Luna: Starting conversation timer (1 minute free)');
      
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
        
        if (remainingSeconds.value <= 0 && !isPaid.value) {
          console.log('🌙 Luna: Free time expired, blocking for payment');
          isBlockedForPayment.value = true;
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

  const openPayment = async () => {
    try {
      // Get user email from localStorage
      const userEmail = localStorage.getItem('guestChat_userEmail');
      
      if (!userEmail) {
        console.error('🚨 Luna: No email available for payment');
        return;
      }

      console.log('🌙 Luna: Opening Stripe payment for €5');
      
      const successUrl = `${window.location.origin}/luna-streaming?payment=success`;
      const cancelUrl = `${window.location.origin}/luna-streaming?payment=cancel`;
      
      const response = await fetch(process.env.API_URL + '/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: `luna_${Date.now()}`, // Generate chat ID for Luna
          email: userEmail,
          successUrl,
          cancelUrl
        })
      });

      const data = await response.json();
      
      if (data.url) {
        window.open(data.url, 'stripe_checkout', 'width=480,height=720');
      }
    } catch (error) {
      console.error('🚨 Luna: Failed to open payment:', error);
    }
  };

  const handlePaymentSuccess = () => {
    console.log('🌙 Luna: Payment successful, removing restrictions');
    isPaid.value = true;
    isBlockedForPayment.value = false;
    
    // Stop the timer since payment is confirmed
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
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
        state.error = 'La session gratuite est terminée. Veuillez régler 5 € pour continuer.';
        return;
      }
      
      // 🚀 Start timer on first message
      if (!conversationStartedAt.value) {
        startConversationTimer();
      }
      
      // Clear any previous errors
      clearError();
      
      // 🚀 DUPLICATION FIX: Add user message to UI immediately (but not to conversationHistory for backend)
      const userMessage = addUserMessage(content);
      
      // Prepare streaming request with CURRENT conversationHistory (excludes the message we just added)
      const request: LunaStreamingRequest = {
        content,
        conversationHistory: conversationHistory.value.slice(0, -1), // Exclude the message we just added
        userEmail: options.userEmail,
        ...(options.chatId && { chatId: options.chatId }),
        useReasoning: options.useReasoning || false,
        enableKnowledge: options.enableKnowledge !== false // Default to true
      };

      // Set initial state
      state.connectionStatus = 'connecting';
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
          updateLastAssistantMessage(state.currentMessage, state.currentReasoning);
        },

        onReasoning: (reasoning: string) => {
          state.currentReasoning += reasoning;
          updateLastAssistantMessage(state.currentMessage, state.currentReasoning);
        },

        onComplete: (result) => {
          console.log('✨ Luna response complete:', {
            completion: result.completion.substring(0, 50) + '...',
            tokens: result.token_count,
            price: `$${result.price.toFixed(4)}`
          });

          // 🚀 User message already in UI, just finalize the assistant response

          // Final update to message
          updateLastAssistantMessage(
            result.completion,
            state.currentReasoning,
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

  return {
    // State
    state,
    messages,
    conversationHistory,
    
    // Computed
    canSendMessage,
    isProcessing,
    hasError,
    formattedRemaining,
    shouldShowTimer,
    shouldShowPaymentBanner,
    
    // Timer & Payment State
    conversationStartedAt,
    isBlockedForPayment,
    isPaid,
    remainingSeconds,
    
    // Methods
    sendMessageToLuna,
    addUserMessage,
    clearError,
    resetConversation,
    disconnect,
    checkConnection,
    testConnection,
    getConversationSummary,
    startConversationTimer,
    openPayment,
    handlePaymentSuccess,
    loadConversation
  };
}
