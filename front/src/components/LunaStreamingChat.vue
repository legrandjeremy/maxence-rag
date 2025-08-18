<template>
  <div class="luna-streaming-chat">
    <!-- Chat Header with Luna Branding -->
    <div class="chat-header hidden">
      <div class="luna-avatar">
        <div class="mystical-aura"></div>
        <span class="luna-symbol">🌙</span>
      </div>
      <div class="header-info hidden">
        <h2 class="luna-title">Luna - Oracle des Lignes Cachées</h2>
        <div class="connection-status" :class="connectionStatusClass">
          <span class="status-indicator"></span>
          {{ connectionStatusText }}
        </div>
      </div>
      
      <!-- Reasoning Mode Toggle -->
      <div class="controls hidden">
        <label class="reasoning-toggle">
          <input 
            type="checkbox" 
            v-model="useReasoning"
            :disabled="isProcessing"
          />
          <span class="toggle-text">Mode Réflexion</span>
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <!-- Messages Container -->
    <div class="messages-container" ref="messagesContainer">
      <div 
        v-for="message in messages" 
        :key="message.id"
        class="message"
        :class="{ 
          'user-message': message.role === 'user', 
          'assistant-message': message.role === 'assistant',
          'streaming': message.isStreaming
        }"
      >
        <!-- User Message -->
        <div v-if="message.role === 'user'" class="message-content user-content">
          <div class="message-avatar">👤</div>
          <div class="message-text">{{ message.content }}</div>
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>

        <!-- Assistant Message -->
        <div v-else class="message-content assistant-content">
          <div class="message-avatar luna-avatar-small">
            <span class="luna-symbol-small">🌙</span>
          </div>
          <div class="message-body">
            <!-- Reasoning Section (if available) -->
            <div v-if="message.reasoning" class="reasoning-section">
              <div class="reasoning-header">
                <span class="reasoning-icon">🧠</span>
                <span class="reasoning-label">Réflexion Mystique de Luna (Debug du mode Réflexion)</span>
                <button 
                  class="reasoning-toggle-btn"
                  @click="toggleReasoning(message.id)"
                  :class="{ expanded: expandedReasoning.has(message.id) }"
                >
                  {{ expandedReasoning.has(message.id) ? '▼' : '▶' }}
                </button>
              </div>
              <div 
                v-if="expandedReasoning.has(message.id)"
                class="reasoning-content"
              >
                <pre class="reasoning-text">{{ message.reasoning }}</pre>
              </div>
            </div>

            <!-- Main Response -->
            <div class="luna-response">
              <div class="message-text luna-text">
                <span v-html="formatLunaResponse(message.content)"></span>
                <span v-if="message.isStreaming" class="typing-indicator">✨</span>
              </div>
              
              <!-- Message Metadata -->
              <div v-if="message.isComplete" class="message-metadata">
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Streaming Indicators -->
      <div v-if="isProcessing" class="streaming-indicators">
        <div v-if="state.isReasoning && currentReasoning && !message.isStreaming" class="current-reasoning">
          <div class="reasoning-header active">
            <span class="reasoning-icon pulsing">🧠</span>
            <span class="reasoning-label">Luna est en train d'écrire...</span>
          </div>
          <div class="reasoning-preview hidden">
            <pre class="reasoning-text">{{ currentReasoning }}</pre>
            <span class="thinking-dots">...</span>
          </div>
        </div>
        
        <div v-if="state.isStreaming && !isProcessing" class="luna-thinking">
          <span class="luna-symbol-small pulsing">🌙</span>
          <span class="thinking-text">Luna va vous répondre dans quelques instants...</span>
          <div class="mystical-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="hasError" class="error-message">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-text">{{ state.error }}</span>
        <button class="error-dismiss" @click="clearError">✕</button>
      </div>
    </div>

    <!-- Input Area -->
    <div class="input-area">
      <div class="input-container">
        <textarea
          ref="messageInput"
          v-model="currentInput"
          @keydown="handleKeyDown"
          @input="autoResize"
          :disabled="!canSendMessage"
          :placeholder="inputPlaceholder"
          class="message-input"
          rows="1"
        ></textarea>
        
        <button 
          @click="sendMessage"
          :disabled="!canSendMessage || !currentInput.trim() || isSending"
          class="send-button"
          :class="{ sending: isProcessing || isSending }"
        >
          <span v-if="!isProcessing">Consulter Luna ✨</span>
          <span v-else>Connexion mystique...</span>
        </button>
      </div>
      
      <!-- 🚀 Timer Display -->
      <div v-if="shouldShowTimer" class="timer-display">
        <q-badge color="primary" outline>
          {{ formattedRemaining }}
        </q-badge>
      </div>

      <!-- 🚀 Payment Banner -->
      <div v-if="shouldShowPaymentBanner" class="payment-banner">
        <div class="payment-content">
          <div class="payment-text">
            ✨ La session gratuite est terminée. Réglez 5 € pour continuer votre consultation avec Luna.
          </div>
          <button @click="openPayment" class="payment-button">
            Payer 5 € ✨
          </button>
        </div>
      </div>
      
      <!-- Input Helper Text -->
      <div class="input-helper hide">
        <span v-if="useReasoning" class="reasoning-hint hidden">
          🧠 Mode réflexion activé - Luna prendra le temps de réfléchir profondément
        </span>
        <span v-else class="normal-hint">
          🌙 Partagez vos ressentis avec Luna pour une guidance mystique
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { useLunaStreaming } from '../composables/useLunaStreaming';
import { useAuthStore } from '../stores/authStore';

// Props and emits
interface Props {
  chatId?: string;
  initialHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

const props = defineProps<Props>();

interface ConversationSummary {
  id: string | undefined;
  title: string;
  messageCount: number;
  timestamp: number;
}

const emit = defineEmits<{
  'conversation-updated': [summary: ConversationSummary];
  'connection-changed': [status: string];
}>();

// Composables
const {
  state, 
  messages, 
  canSendMessage, 
  isProcessing, 
  hasError,
  sendMessageToLuna,
  clearError,
  // resetConversation, // Commented out - not used in this component currently
  disconnect,
  testConnection,
  getConversationSummary,
  loadConversation,
  // 🚀 Timer and Payment
  formattedRemaining,
  shouldShowTimer,
  shouldShowPaymentBanner,
  isBlockedForPayment,
  isPaid,
  openPayment,
  handlePaymentSuccess
} = useLunaStreaming();

const authStore = useAuthStore();

// Reactive refs
const currentInput = ref('');
const useReasoning = ref(true);
const isSending = ref(false); // 🚀 Local guard against duplicate sends
const messagesContainer = ref<HTMLElement>();
const messageInput = ref<HTMLTextAreaElement>();
const expandedReasoning = ref(new Set<string>());

// Computed properties
const connectionStatusClass = computed(() => {
  switch (state.connectionStatus) {
    case 'connected': return 'connected';
    case 'connecting': return 'connecting';
    case 'error': return 'error';
    default: return 'disconnected';
  }
});

const connectionStatusText = computed(() => {
  switch (state.connectionStatus) {
    case 'connected': return 'Connexion mystique établie';
    case 'connecting': return 'Établissement de la connexion...';
    case 'error': return 'Perturbation dans les énergies';
    default: return 'En attente de connexion';
  }
});

const inputPlaceholder = computed(() => {
  if (!canSendMessage.value) {
    return 'Connexion avec Luna en cours...';
  }
  
  if (messages.value.length === 0) {
    return 'Dites votre prénom et ce que vous ressentez...';
  }
  
  return 'Continuez votre consultation avec Luna...';
});

const currentReasoning = computed(() => state.currentReasoning);

// Methods
const sendMessage = async () => {
  // 🚀 DUPLICATE PREVENTION: Check multiple conditions
  if (!currentInput.value.trim() || !canSendMessage.value || isProcessing.value || isSending.value) {
    return;
  }

  // 🚀 Set local sending flag immediately to prevent race conditions
  isSending.value = true;

  try {
    // Check if we have a user email
    const userEmail = authStore.user?.email || localStorage.getItem('luna_guest_email');
    
    if (!userEmail) {
      // Prompt for email if not available
      const email = await promptForEmail();
      if (!email) {
        isSending.value = false; // 🚀 Reset flag if user cancelled
        return; // User cancelled
      }
      localStorage.setItem('luna_guest_email', email);
    }

    const content = currentInput.value.trim();
    currentInput.value = '';
    autoResize();

    await sendMessageToLuna(content, {
      useReasoning: useReasoning.value,
      enableKnowledge: true,
      userEmail: userEmail || localStorage.getItem('luna_guest_email') || 'anonymous',
      ...(props.chatId && { chatId: props.chatId })
    });

    // Emit conversation update
    const summary = getConversationSummary();
    const conversationSummary: ConversationSummary = {
      id: props.chatId,
      title: messages.value.length > 0 ? 
        messages.value[0]?.content?.substring(0, 50) + '...' : 
        'Nouvelle conversation',
      messageCount: summary.totalMessages,
      timestamp: Date.now()
    };
    emit('conversation-updated', conversationSummary);
    
    // Scroll to bottom
    await nextTick();
    scrollToBottom();

  } catch (error) {
    console.error('Failed to send message:', error);
  } finally {
    // 🚀 Always reset sending flag, even on error
    isSending.value = false;
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    void sendMessage();
  }
};

const autoResize = () => {
  if (messageInput.value) {
    messageInput.value.style.height = 'auto';
    messageInput.value.style.height = Math.min(messageInput.value.scrollHeight, 150) + 'px';
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const toggleReasoning = (messageId: string) => {
  if (expandedReasoning.value.has(messageId)) {
    expandedReasoning.value.delete(messageId);
  } else {
    expandedReasoning.value.add(messageId);
  }
};

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatLunaResponse = (content: string): string => {
  if (!content) return 'Luna va vous répondre dans quelques instants...';
  
  // Add mystical formatting to Luna's responses
  return content
    .replace(/\*([^*]+)\*/g, '<em class="mystical-emphasis">$1</em>')
    .replace(/\n/g, '<br>')
    .replace(/✨/g, '<span class="sparkle">✨</span>');
};

const promptForEmail = (): Promise<string | null> => {
  return new Promise((resolve) => {
    // Use a simple browser prompt for now - can be enhanced later
    const email = prompt(
      '🌙 Luna a besoin de votre email pour établir une connexion mystique.\n\nVeuillez entrer votre adresse email:'
    );
    
    if (email && email.trim()) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email.trim())) {
        resolve(email.trim());
      } else {
        alert('⚠️ Veuillez entrer une adresse email valide.');
        // Retry
        void promptForEmail().then(resolve);
      }
    } else {
      resolve(null);
    }
  });
};

// Lifecycle
onMounted(async () => {
  // Load initial conversation if provided
  if (props.initialHistory && props.initialHistory.length > 0) {
    loadConversation({
      messages: props.initialHistory.map(msg => ({
        ...msg,
        timestamp: Date.now()
      }))
    });
  }

  // 🚀 Add payment success listener (inspired by GuestChatWidget)
  const handlePaymentMessage = (event: MessageEvent) => {
    if (event.data.type === 'payment-success') {
      console.log('🌙 Luna: Payment success detected');
      handlePaymentSuccess();
    }
  };
  
  window.addEventListener('message', handlePaymentMessage);
  
  // Store reference for cleanup
  (window as any).lunaPaymentHandler = handlePaymentMessage;

  // Test WebSocket connection on mount
  try {
    console.log('🌙 Testing Luna WebSocket connection on mount...');
    
    // Try to get user email from auth store or localStorage
    const userEmail = authStore.user?.email || localStorage.getItem('guestChat_userEmail');
    console.log('🌙 userEmail', userEmail);
    
    if (userEmail) {
      const isConnected = await testConnection(userEmail);
      emit('connection-changed', isConnected ? 'connected' : 'error');
      
      if (isConnected) {
        console.log('✅ Luna WebSocket: Connected successfully on mount');
      } else {
        console.warn('⚠️ Luna WebSocket: Connection test failed on mount');
      }
    } else {
      console.log('🎭 Luna WebSocket: No email available yet, will connect when user sends first message');
      emit('connection-changed', 'disconnected');
    }
  } catch (error) {
    console.error('🚨 Luna WebSocket: Connection test error on mount:', error);
    emit('connection-changed', 'error');
  }

  // Focus input
  await nextTick();
  messageInput.value?.focus();
  
  // Scroll to bottom
  scrollToBottom();

  console.log('🌙 Luna Streaming Chat initialized 2');
});

onUnmounted(() => {
  disconnect();
  
  // 🚀 Cleanup payment listener
  if ((window as any).lunaPaymentHandler) {
    window.removeEventListener('message', (window as any).lunaPaymentHandler);
    delete (window as any).lunaPaymentHandler;
  }
  
  console.log('🌙 Luna Streaming Chat cleanup');
});

// Watch for connection status changes
import { watch } from 'vue';
import { route } from 'quasar/wrappers';
watch(() => state.connectionStatus, (status) => {
  emit('connection-changed', status);
});
</script>

<style scoped>
.luna-streaming-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #e8e8e8;
  font-family: 'Inter', sans-serif;
}

/* Header Styles */
.chat-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.luna-avatar {
  position: relative;
  width: 50px;
  height: 50px;
  margin-right: 1rem;
}

.mystical-aura {
  position: absolute;
  inset: -5px;
  background: conic-gradient(from 0deg, #4f46e5, #06b6d4, #10b981, #f59e0b, #ef4444, #4f46e5);
  border-radius: 50%;
  animation: rotate 3s linear infinite;
  opacity: 0.7;
}

.luna-symbol {
  position: absolute;
  inset: 5px;
  background: #1a1a2e;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.header-info {
  flex: 1;
}

.luna-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #f8fafc;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
}

.connection-status.connected .status-indicator {
  background: #10b981;
  animation: pulse 2s infinite;
}

.connection-status.connecting .status-indicator {
  background: #f59e0b;
  animation: blink 1s infinite;
}

/* Reasoning Toggle */
.reasoning-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.reasoning-toggle input {
  display: none;
}

.toggle-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.toggle-slider {
  width: 40px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  position: relative;
  transition: background 0.3s;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

.reasoning-toggle input:checked + .toggle-text + .toggle-slider {
  background: #4f46e5;
}

.reasoning-toggle input:checked + .toggle-text + .toggle-slider::after {
  transform: translateX(20px);
}

/* Messages Container */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  scroll-behavior: smooth;
}

.message {
  margin-bottom: 1.5rem;
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.user-content {
  flex-direction: row-reverse;
}

.assistant-content {
  max-width: 85%;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.luna-avatar-small {
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  position: relative;
}

.luna-symbol-small {
  font-size: 1.25rem;
}

.message-body {
  flex: 1;
}

.message-text {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  line-height: 1.5;
}

.user-content .message-text {
  background: #4f46e5;
  color: white;
}

.luna-text {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(6, 182, 212, 0.2));
  border: 1px solid rgba(79, 70, 229, 0.3);
}

.typing-indicator {
  animation: glow 1.5s ease-in-out infinite alternate;
  margin-left: 0.5rem;
}

/* Reasoning Section */
.reasoning-section {
  margin-bottom: 1rem;
  border: 1px solid rgba(147, 51, 234, 0.3);
  border-radius: 0.5rem;
  background: rgba(147, 51, 234, 0.1);
}

.reasoning-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid rgba(147, 51, 234, 0.2);
}

.reasoning-header.active {
  background: rgba(147, 51, 234, 0.2);
}

.reasoning-icon {
  font-size: 1rem;
}

.reasoning-icon.pulsing {
  animation: pulse 1.5s infinite;
}

.reasoning-label {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: #c084fc;
}

.reasoning-toggle-btn {
  background: none;
  border: none;
  color: #c084fc;
  cursor: pointer;
  font-size: 0.75rem;
  transition: transform 0.2s;
}

.reasoning-toggle-btn.expanded {
  transform: rotate(0deg);
}

.reasoning-content {
  padding: 0.75rem;
}

.reasoning-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  line-height: 1.4;
  color: #e2e8f0;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Streaming Indicators */
.streaming-indicators {
  margin-bottom: 1rem;
}

.current-reasoning {
  margin-bottom: 1rem;
  border: 1px solid rgba(147, 51, 234, 0.3);
  border-radius: 0.5rem;
  background: rgba(147, 51, 234, 0.1);
}

.reasoning-preview {
  padding: 0.75rem;
  position: relative;
}

.thinking-dots {
  color: #c084fc;
  font-weight: bold;
  animation: pulse 1s infinite;
}

.luna-thinking {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(79, 70, 229, 0.1);
  border-radius: 0.5rem;
  border: 1px solid rgba(79, 70, 229, 0.3);
}

.thinking-text {
  flex: 1;
  color: #a5b4fc;
  font-style: italic;
}

.mystical-dots {
  display: flex;
  gap: 0.25rem;
}

.mystical-dots span {
  width: 6px;
  height: 6px;
  background: #4f46e5;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite both;
}

.mystical-dots span:nth-child(1) { animation-delay: -0.32s; }
.mystical-dots span:nth-child(2) { animation-delay: -0.16s; }

/* Message Metadata */
.message-metadata {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

.message-time, .token-count, .price {
  opacity: 0.7;
}

/* Error Message */
.error-message {
  margin: 1rem;
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-text {
  flex: 1;
  color: #fca5a5;
}

.error-dismiss {
  background: none;
  border: none;
  color: #fca5a5;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
}

/* Input Area */
.input-area {
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.input-container {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  min-height: 40px;
  max-height: 150px;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  color: #f8fafc;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}

.message-input:focus {
  border-color: #4f46e5;
  background: rgba(255, 255, 255, 0.15);
}

.message-input::placeholder {
  color: #94a3b8;
}

.send-button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  border: none;
  border-radius: 0.75rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
  white-space: nowrap;
}

.send-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.send-button.sending {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  animation: pulse 2s infinite;
}

.input-helper {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #94a3b8;
  text-align: center;
}

.reasoning-hint {
  color: #c084fc;
}

/* 🚀 Timer Display */
.timer-display {
  margin-top: 0.75rem;
  text-align: center;
}

/* 🚀 Payment Banner */
.payment-banner {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f3e8ff, #e0e7ff);
  border: 2px solid #c084fc;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(192, 132, 252, 0.2);
}

.payment-content {
  text-align: center;
}

.payment-text {
  color: #5b21b6;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  font-weight: 500;
}

.payment-button {
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
}

.payment-button:hover {
  background: linear-gradient(135deg, #6d28d9, #a855f7);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
}

.payment-button:active {
  transform: translateY(0);
}

/* Animations */
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

@keyframes glow {
  from { text-shadow: 0 0 5px #4f46e5; }
  to { text-shadow: 0 0 15px #4f46e5, 0 0 25px #4f46e5; }
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  } 40% {
    transform: scale(1);
  }
}

/* Mystical Text Formatting */
.mystical-emphasis {
  color: #c084fc;
  font-style: italic;
  text-shadow: 0 0 5px rgba(192, 132, 252, 0.5);
}

.sparkle {
  display: inline-block;
  animation: glow 2s ease-in-out infinite alternate;
}
</style>
