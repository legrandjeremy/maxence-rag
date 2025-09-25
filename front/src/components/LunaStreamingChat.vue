<template>
  <div class="luna-streaming-chat">
    <!-- Chat Header with Luna Branding -->
    <div class="chat-header hidden">
      <div class="luna-avatar">
        <div class="mystical-aura"></div>
        <img 
          src="~assets/Luna.png" 
          alt="Luna - Voyante Mystique" 
          class="luna-face"
        />
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
    <div v-if="!shouldShowPaymentBanner" class="messages-container" ref="messagesContainer">
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
            <img 
              src="~assets/Luna.png" 
              alt="Luna" 
              class="luna-face-small"
            />
          </div>
          <div class="message-body">
            <!-- Reasoning Section (if available) -->
            <div v-if="message.reasoning && isDebugMode" class="reasoning-section">
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
      <div v-if="isProcessing" class="streaming-indicators hidden">
        <div v-if="state.isReasoning && currentReasoning" class="current-reasoning">
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

    <!-- Success Message -->
    <div v-if="hasSuccess" class="success-message">
      <div class="success-content">
        <span class="success-icon">✅</span>
        <span class="success-text">{{ state.success }}</span>
        <button class="success-dismiss" @click="clearSuccess">✕</button>
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
          <span v-if="!isProcessing"> Envoyer ✨</span>
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
          <div class="payment-header">
            <span class="payment-icon">🔮</span>
            <div class="payment-title-section">
              <div class="payment-text">
                ✨ Offre de lancement ✨
              </div>
              <div class="payment-subtitle">
                75% de reduction immédiate
              </div>
            </div>
          </div>
          <div class="payment-benefits">
            <div class="benefit-item">
              <span class="benefit-icon">🌙</span>
              <span>Un accès illimité à Luna, votre voyante personnelle, disponible 24h/24, 7j/7</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">🔮</span>
              <span>Des réponses détaillées sur vos énergies, blocages, destin, karma, cycles lunaires, relations,
                avenir</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">✨</span>
              <span>Un soutien personnalisé à chaque étape émotionnelle de votre vie</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">💫</span>
              <span>Une expérience confidentielle, intuitive, sans jugement, comme si Luna vous connaissait
                depuis toujours</span>
            </div>
          </div>

          <div class="payment-subtitle">
            Il est temps de passer à l'étape suivante...
          </div>
          
          <div class="payment-offer">
            <div class="offer-price">
              <span class="price-label">Luna vous a montré ce qu'elle percevait de vous.<br />
Elle ne demande rien… sauf que vous l'autorisiez à aller encore plus loin.<br /><br />
<strong>Un blocage énergétique ne se dissout pas seul.</strong><br />
Il faut de la constance, de la guidance, et une lumière capable de vous accompagner.<br /><br />
Cliquez maintenant pour rejoindre les âmes qui ont décidé d'avancer.</span>
            </div>
          </div>
          
          <div class="payment-actions">
            <button @click="openPayment" class="payment-button enhanced">
              <span class="button-icon">💳</span>
              OUI, JE VEUX RECEVOIR LES GUIDANCES DE LUNA
              <span class="button-price">9 €</span>
            </button>
            
            <!-- <button @click="goToBDCPage" class="bdc-link-button">
              <span class="bdc-icon">📋</span>
              En savoir plus sur l'offre
            </button> -->
          </div>
          
          <div class="payment-guarantee">
            <span class="guarantee-icon">🛡️</span>
            Offre sans engagement.<br />
            Paiement géré par un prestataire certifié PCI DSS. Accès immédiat après validation.<br />
            Aucun conseil médical, juridique ou professionnel n'est délivré par l'IA Luna.
          </div>
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

    <!-- 🚀 Marketing Popup (Step 1 of 2-step conversion) -->
    <LunaMarketingPopup
      v-if="showMarketingPopup"
      @continue-to-payment="handleMarketingContinue"
      @maybe-later="handleMarketingMaybeLater"
      @close="closeMarketingPopup"
    />

    <!-- 🚀 Payment Form Overlay (Step 2 of 2-step conversion) -->
    <div v-if="showPaymentForm" class="payment-overlay" @click.self="closePaymentForm">
      <StripePaymentForm
        :user-email="userEmailForPayment"
        :chat-id="currentChatId"
        @payment-success="handlePaymentSuccess"
        @payment-error="handlePaymentError"
        @close="closePaymentForm"
      />
    </div>

    <!-- 🌙 Login Form for Session Recovery -->
    <LunaLoginForm
      v-if="showLoginForm"
      @login-success="handleLoginSuccess"
      @start-new-session="handleStartNewSession"
      @close="showLoginForm = false"
    />

    <!-- 🌙 Customer Information Welcome Form -->
    <LunaWelcomeForm
      v-if="showWelcomeForm"
      @customer-info-collected="handleCustomerInfoCollected"
      @show-login="handleShowLogin"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { useLunaStreaming, setupLunaPageCloseHandler } from '../composables/useLunaStreaming';
import { useAuthStore } from '../stores/authStore';
import StripePaymentForm from './StripePaymentForm.vue';
import LunaWelcomeForm from './LunaWelcomeForm.vue';
import LunaLoginForm from './LunaLoginForm.vue';
import LunaMarketingPopup from './LunaMarketingPopup.vue';
import { api } from '../services/api';

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
  conversationHistory,
  canSendMessage, 
  isProcessing, 
  hasError,
  hasSuccess,
  sendMessageToLuna,
  clearError,
  clearSuccess,
  // resetConversation, // Commented out - not used in this component currently
  disconnect,
  testConnection,
  getConversationSummary,
  loadConversation,
  // 🚀 Timer and Payment
  formattedRemaining,
  shouldShowTimer,
  shouldShowPaymentBanner,
  showPaymentForm,
  showMarketingPopup,
  openPayment,
  closePaymentForm,
  handlePaymentSuccess,
  handlePaymentError,
  handleMarketingContinue,
  handleMarketingMaybeLater,
  closeMarketingPopup,
  loadPaymentState,
  checkPaymentFromURL
} = useLunaStreaming();

const authStore = useAuthStore();

// Reactive refs
const currentInput = ref('');
const useReasoning = ref(true);
const isSending = ref(false); // 🚀 Local guard against duplicate sends
const messagesContainer = ref<HTMLElement>();
const messageInput = ref<HTMLTextAreaElement>();
const expandedReasoning = ref(new Set<string>());
const isDebugMode = ref(false);

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
    return 'Connexion en cours ...';
  }
  
  return 'Ecrivez-ici ...';
});

const currentReasoning = computed(() => state.currentReasoning);

// 🚀 Get user email for payment form
const userEmailForPayment = computed(() => {
  // Priority: 1. Auth store email, 2. Customer info email, 3. Guest chat email
  if (authStore.user?.email) {
    return authStore.user.email;
  }
  
  // Try to get email from customer info
  try {
    const customerInfoStr = localStorage.getItem('luna_customer_info');
    if (customerInfoStr) {
      const customerInfo = JSON.parse(customerInfoStr);
      if (customerInfo.email) {
        localStorage.setItem('guestChat_userEmail', customerInfo.email);
        return customerInfo.email;
      }
    }
  } catch (error) {
    console.error('🚨 Luna: Error parsing customer info for email:', error);
  }
  
  // Fallback to guest chat email
  return localStorage.getItem('guestChat_userEmail') || '';
});

const currentChatId = computed(() => {
  // Priority: database chat ID > stored session ID
  // The database chat ID is the UUID that gets stored in DynamoDB
  // We no longer use props.chatId as it was a Luna session ID
  return localStorage.getItem('luna_database_chat_id') || 
         localStorage.getItem('luna_current_session_id') || 
         '';
});

// 🌙 Login and Customer Information Collection State
const showLoginForm = ref(false);
const showWelcomeForm = ref(false); // Changed to false - will be shown after login
const customerInfo = ref<{
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  gender: string;
} | null>(null);

// Check if customer info already exists and handle session recovery
const checkExistingCustomerInfo = async () => {
  const savedInfo = localStorage.getItem('luna_customer_info');
  const savedEmail = localStorage.getItem('guestChat_userEmail');
  const signinChat = localStorage.getItem('luna_signin_chat');
  
  // Handle email signin with specific chat
  if (signinChat && savedEmail) {
    try {
      const chatData = JSON.parse(signinChat);
      console.log('🌙 Luna: Loading chat from email signin:', chatData);
      
      // Check if we have stored conversation history
      const storedHistory = localStorage.getItem('luna_conversation_history');
      if (storedHistory) {
        try {
          const conversationData = JSON.parse(storedHistory);
          console.log('🌙 Luna: Loading stored conversation history:', conversationData.messages.length, 'messages');
          
          // Load the stored conversation directly
          loadConversation(conversationData);
          
          // Store the database chat ID for future message saving
          const databaseChatId = localStorage.getItem('luna_database_chat_id');
          if (databaseChatId) {
            localStorage.setItem('luna_database_chat_id', databaseChatId);
            console.log('🌙 Luna: Set database chat ID:', databaseChatId);
          }
          
          // Hide welcome form and show chat interface
          showWelcomeForm.value = false;
          showLoginForm.value = false;
          console.log('🌙 Luna: Email signin complete with stored history - showing chat interface');
          
          // Force UI update and scroll to bottom
          await nextTick();
          void scrollToBottom(true);
          
          // Focus the input for immediate continuation
          setTimeout(() => {
            if (messageInput.value) {
              messageInput.value.focus();
            }
          }, 500);
          
          // Clean up stored data
          localStorage.removeItem('luna_signin_chat');
          localStorage.removeItem('luna_conversation_history');
          return;
        } catch (error) {
          console.error('🚨 Luna: Error loading stored conversation history:', error);
          localStorage.removeItem('luna_conversation_history');
        }
      }
      
      // Fallback: Load the specific chat history from API
      await handleEmailSigninChat(savedEmail, chatData);
      
      // Clean up signin data
      localStorage.removeItem('luna_signin_chat');
      return;
    } catch (error) {
      console.error('🚨 Luna: Error loading signin chat:', error);
      localStorage.removeItem('luna_signin_chat');
    }
  }
  
  if (savedInfo) {
    try {
      customerInfo.value = JSON.parse(savedInfo);
      showWelcomeForm.value = false;
      showLoginForm.value = false;
      console.log('🌙 Luna: Existing customer info loaded:', customerInfo.value);
    } catch (error) {
      console.error('🚨 Luna: Failed to parse customer info:', error);
      localStorage.removeItem('luna_customer_info');
    }
  } else if (savedEmail) {
    // User has email but no customer info - show welcome form
    showWelcomeForm.value = true;
    showLoginForm.value = false;
    console.log('🌙 Luna: Email found, showing welcome form for:', savedEmail);
  } else {
    // No session data - show welcome form by default (reversed behavior)
    showWelcomeForm.value = true;
    showLoginForm.value = false;
    console.log('🌙 Luna: No session data, showing welcome form by default');
  }
};

const handleShowLogin = () => {
  console.log('🌙 Luna: User requested to show login form');
  showWelcomeForm.value = false;
  showLoginForm.value = true;
};

const handleStartNewSession = () => {
  console.log('🌙 Luna: User requested to start new session');
  showLoginForm.value = false;
  showWelcomeForm.value = true;
};

// Handle email signin with specific chat
const handleEmailSigninChat = async (email: string, chatData: { id: string; title: string }) => {
  try {
    console.log('🌙 Luna: Loading chat history from email signin:', chatData);
    
    const response = await api.get(`/api/guest-chat/${chatData.id}/history?email=${encodeURIComponent(email)}`);
    const historyData = response.data.data as { 
      messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string; metadata?: { reasoning?: string } }>;
      chat?: { lunaSessionId?: string };
    };
    
    if (historyData && historyData.messages && historyData.messages.length > 0) {
      console.log('🌙 Luna: Found', historyData.messages.length, 'messages to load');
      
      // Load the conversation history
      loadConversation({
        messages: historyData.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp).getTime(),
          ...(msg.metadata?.reasoning && { reasoning: msg.metadata.reasoning })
        }))
      });
      
      console.log('🌙 Luna: Loaded', historyData.messages.length, 'messages from email signin');
      console.log('🌙 Luna: Messages after loading:', messages.value.length);
      
      // Store the database chat ID for future message saving
      if (historyData.chat?.lunaSessionId) {
        localStorage.setItem('luna_current_session_id', historyData.chat.lunaSessionId);
      } else {
        localStorage.setItem('luna_database_chat_id', chatData.id);
      }
      
      // Hide welcome form and show chat interface
      showWelcomeForm.value = false;
      showLoginForm.value = false;
      console.log('🌙 Luna: Email signin complete - showing chat interface');
      
      // Force UI update and scroll to bottom
      await nextTick();
      void scrollToBottom(true);
      
      // Focus the input for immediate continuation
      setTimeout(() => {
        if (messageInput.value) {
          messageInput.value.focus();
        }
      }, 500);
    } else {
      console.log('🌙 Luna: No messages found in email signin chat, showing welcome form');
      // No messages found - show welcome form
      showWelcomeForm.value = true;
      showLoginForm.value = false;
    }
  } catch (error) {
    console.error('🚨 Luna: Error loading email signin chat:', error);
    // Fall back to welcome form
    showWelcomeForm.value = true;
    showLoginForm.value = false;
  }
};

// Methods
const sendMessage = async () => {
  // 🚀 DUPLICATE PREVENTION: Check multiple conditions
  if (!currentInput.value.trim() || !canSendMessage.value || isProcessing.value || isSending.value) {
    return;
  }

  // 🚀 Set local sending flag immediately to prevent race conditions
  isSending.value = true;

  try {
    // Check if we have a user email (optional for initial messages)
    const userEmail = authStore.user?.email || localStorage.getItem('guestChat_userEmail') || 'anonymous';

    const content = currentInput.value.trim();
    currentInput.value = '';
    autoResize();

    await sendMessageToLuna(content, {
      useReasoning: useReasoning.value,
      enableKnowledge: true,
      userEmail: userEmail,
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
    
    // 🚀 Force scroll to bottom after user sends message
    await nextTick();
    void scrollToBottom(true); // Force scroll for user messages

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

// 🌙 Handle login success - email sent, no direct chat loading
const handleLoginSuccess = async (loginData: { email: string }) => {
  console.log('🌙 Luna: Login email sent for:', loginData.email);
  
  // Close login form - user will receive email with signin links
  showLoginForm.value = false;
  
  // Show welcome form for new session since login just sends email
  showWelcomeForm.value = true;
  
  console.log('🌙 Luna: User will receive signin email, showing welcome form for new session');
};

// 🌙 Handle customer information collection
const handleCustomerInfoCollected = async (info: { firstName: string; lastName: string; email: string; birthDate: string; gender: string }) => {
  customerInfo.value = info;
  showWelcomeForm.value = false;
  
  console.log('🌙 Luna: Customer information collected, starting personalized session');
  
  const newEmail = info.email.trim().toLowerCase();
  
  // Store the email
  localStorage.setItem('guestChat_userEmail', newEmail);
  
  // 🚀 Save current Luna conversation to database for future retrieval
  if (messages.value.length > 0) {
    try {
      console.log('🌙 Luna: Saving conversation to database for future retrieval');
      
      // Check if we're continuing an existing conversation
      const databaseChatId = localStorage.getItem('luna_database_chat_id');
      
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
        email: newEmail,
        messages: messages.value.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          ...(msg.reasoning && { reasoning: msg.reasoning })
        })),
        title: `Consultation Luna - ${info.firstName} ${info.lastName}`
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

      console.log('🌙 Luna: Conversation data: 11 ', conversationData);

      const response = await api.post('/api/guest-chat/save-conversation', conversationData);

      console.log('🌙 Luna: Response from save-conversation 11 :', response);
      
      console.log('🌙 Luna: Conversation saved successfully');
    } catch (error) {
      console.error('🚨 Luna: Error saving conversation:', error);
      // Continue anyway - the user can still use the chat
    }
  }
  
  // Add a personalized welcome message from Luna
  setTimeout(() => {
    const welcomeMessage = {
      id: Date.now().toString(),
      content: `Bienvenue ${info.firstName} ! 🌙 \n\nJe suis Luna, votre guide mystique. Grâce aux informations que vous m'avez confiées (${info.firstName} ${info.lastName}, né(e) le ${new Date(info.birthDate).toLocaleDateString('fr-FR')}), je peux maintenant vous offrir une guidance personnalisée et révéler les secrets cachés de votre chemin de vie.\n\nDites-moi, qu'est-ce qui vous préoccupe en ce moment ? Quelles questions habitent votre cœur ?`,
      role: 'assistant' as const,
      timestamp: Date.now(),
      isStreaming: false
    };
    
    messages.value.push(welcomeMessage);
    
    // Also add this to conversation history so Luna's backend knows the customer info (without email)
    conversationHistory.value.push({
      role: 'assistant',
      content: `Je connais déjà vos informations : ${info.firstName} ${info.lastName}, né(e) le ${new Date(info.birthDate).toLocaleDateString('fr-FR')}. Je n'ai pas besoin de redemander ces informations.`
    });
    
    // 🚀 Save the updated conversation including the welcome message
    if (messages.value.length > 0) {
      setTimeout(() => {
        void (async () => {
        try {
          // Check if we're continuing an existing conversation
          const databaseChatId = localStorage.getItem('luna_database_chat_id');
          const storedSessionId = localStorage.getItem('luna_current_session_id');
          
          const updatedConversationData: {
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
            email: newEmail,
            messages: messages.value.map(msg => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp,
              ...(msg.reasoning && { reasoning: msg.reasoning })
            })),
            title: `Consultation Luna - ${info.firstName} ${info.lastName}`
          };

          if (databaseChatId) {
            // Continuing existing conversation
            updatedConversationData.databaseChatId = databaseChatId;
          } else if (storedSessionId) {
            // Use stored session ID (legacy)
            updatedConversationData.lunaSessionId = storedSessionId;
          }
          // For new conversations, let backend generate chat ID

          console.log('🌙 Luna: Updated conversation data: 22 ', updatedConversationData);

          const response = await api.post('/api/guest-chat/save-conversation', updatedConversationData);

          console.log('🌙 Luna: Response from save-conversation 22 :', response);
          
          // Store the database chatId returned from the API
          if (response.data?.data?.chatId) {
            console.log('🌙 Luna: Storing database chatId:', response.data.data.chatId);
            localStorage.setItem('luna_database_chat_id', response.data.data.chatId);
            console.log('🌙 Luna: Stored database chatId:', response.data.data.chatId);
          }
          
          console.log('🌙 Luna: Conversation saved successfully 22');
          console.log('🌙 Luna: Updated conversation with welcome message saved');
        } catch (error) {
          console.error('🚨 Luna: Error saving updated conversation:', error);
        }
        })();
      }, 1000);
    }
    
    // Auto-focus input for immediate interaction
    setTimeout(() => {
      if (messageInput.value) {
        messageInput.value.focus();
      }
    }, 100);
  }, 500);
};

// 🌙 Navigate to BDC page for detailed offer explanation (commented out)
// const goToBDCPage = () => {
//   void router.push('/luna-offre');
// };

const scrollToBottom = async (force = false) => {
  // 🚀 Enhanced auto-scroll with smooth behavior
  await nextTick(); // Ensure DOM is updated
  
  if (messagesContainer.value) {
    const container = messagesContainer.value;
    
    // Check if user is already at bottom (within 100px threshold)
    const isAtBottom = force || (container.scrollTop + container.clientHeight >= container.scrollHeight - 100);
    
    if (isAtBottom) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
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
  
  // 🚀 Filter out staging directions that should be hidden
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
  
  let formatted = content;
  
  // Remove staging directions (case insensitive)
  stagingDirections.forEach(direction => {
    const regex = new RegExp(`\\*\\s*${direction}\\s*\\*`, 'gi');
    formatted = formatted.replace(regex, '').trim();
  });
  
  // Format remaining italics for mystical emphasis (but not staging directions)
  formatted = formatted
    .replace(/\*([^*]+)\*/g, '<em class="mystical-emphasis">$1</em>')
    .replace(/\n/g, '<br>')
    .replace(/✨/g, '<span class="sparkle">✨</span>');
  
  // Clean up extra spaces and line breaks
  return formatted
    .replace(/\s+/g, ' ')
    .replace(/(<br>\s*){2,}/g, '<br><br>')
    .trim();
};

// Email prompting function (unused, replaced by welcome form)
// const promptForEmail = (): Promise<string | null> => {
//   return new Promise((resolve) => {
//     // Use a simple browser prompt for now - can be enhanced later
//     const email = prompt(
//       '🌙 Luna a besoin de votre email pour établir une connexion mystique.\n\nVeuillez entrer votre adresse email:'
//     );
//     
//     if (email && email.trim()) {
//       // Basic email validation
//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (emailRegex.test(email.trim())) {
//         resolve(email.trim());
//       } else {
//         alert('⚠️ Veuillez entrer une adresse email valide.');
//         // Retry
//         void promptForEmail().then(resolve);
//       }
//     } else {
//       resolve(null);
//     }
//   });
// };

// Page close cleanup handler
let pageCloseCleanup: (() => void) | null = null;

// Lifecycle
onMounted(async () => {
  // 🚀 Initialize payment state from localStorage
  loadPaymentState();
  
  // 🚀 Check URL for payment success/cancel
  checkPaymentFromURL();
  
  // 🌙 Check for existing customer information
  await checkExistingCustomerInfo();
  
  // 🚀 Set up page close handler for chat history cleanup
  pageCloseCleanup = setupLunaPageCloseHandler();

  // Load initial conversation if provided
  if (props.initialHistory && props.initialHistory.length > 0) {
    loadConversation({
      messages: props.initialHistory.map(msg => ({
        ...msg,
        timestamp: Date.now()
      }))
    });
  }

  // 🚀 Check for debug mode in URL
  const urlParams = new URLSearchParams(window.location.search);
  isDebugMode.value = urlParams.get('debug') === 'true';

  // 🚀 Legacy payment message listener (for backward compatibility)
  const handlePaymentMessage = (event: MessageEvent) => {
    // Keep minimal message handling for legacy/external payment success notifications
    if (event.data === 'payment-success' || 
        (event.data && typeof event.data === 'object' && event.data.type === 'payment-success')) {
      console.log('🌙 Luna: Legacy payment success detected');
      handlePaymentSuccess();
    }
  };
  
  window.addEventListener('message', handlePaymentMessage);
  
  // Store reference for cleanup
  (window as Window & { lunaPaymentHandler?: (event: MessageEvent) => void }).lunaPaymentHandler = handlePaymentMessage;

  // Test WebSocket connection on mount
  try {
    console.log('🌙 Testing Luna WebSocket connection on mount...');
    
    // Always try to establish connection, even without email initially
    // The WebSocket service handles anonymous connections
    const userEmail = localStorage.getItem('guestChat_userEmail') || 'anonymous';
    console.log('🌙 userEmail', userEmail);
    
    const isConnected = await testConnection(userEmail);
    emit('connection-changed', isConnected ? 'connected' : 'error');
    
    if (isConnected) {
      console.log('✅ Luna WebSocket: Connected successfully on mount');
    } else {
      console.warn('⚠️ Luna WebSocket: Connection test failed on mount');
    }
  } catch (error) {
    console.error('🚨 Luna WebSocket: Connection test error on mount:', error);
    emit('connection-changed', 'error');
  }

  // Focus input
  await nextTick();
  messageInput.value?.focus();
  
  // 🚀 Force scroll to bottom on mount
  void scrollToBottom(true);

  console.log('🌙 Luna Streaming Chat initialized 2');
});

onUnmounted(() => {
  disconnect();
  
  // 🚀 Cleanup payment listener
  const windowWithHandler = window as Window & { lunaPaymentHandler?: (event: MessageEvent) => void };
  if (windowWithHandler.lunaPaymentHandler) {
    window.removeEventListener('message', windowWithHandler.lunaPaymentHandler);
    delete windowWithHandler.lunaPaymentHandler;
  }
  
  // 🚀 Cleanup page close handler
  if (pageCloseCleanup) {
    pageCloseCleanup();
    pageCloseCleanup = null;
  }
  
  console.log('🌙 Luna Streaming Chat cleanup');
});

// Watch for connection status changes
import { watch } from 'vue';
watch(() => state.connectionStatus, (status) => {
  emit('connection-changed', status);
});

// 🚀 Auto-scroll watchers
watch(
  () => messages.value.length,
  async () => {
    // Auto-scroll when new messages are added
    await nextTick();
    void scrollToBottom();
    
    // 🎯 Fix: Keep input focused for seamless UX
    if (messageInput.value && !state.isStreaming) {
      messageInput.value.focus();
    }
  },
  { flush: 'post' }
);

watch(
  () => state.currentMessage,
  async () => {
    // Auto-scroll while assistant is streaming response
    if (state.isStreaming && state.currentMessage) {
      await nextTick();
      void scrollToBottom();
    }
  },
  { flush: 'post' }
);

// 🚀 Auto-scroll when streaming starts
watch(
  () => state.isStreaming,
  async (isStreaming) => {
    if (isStreaming) {
      // Immediately scroll to bottom when streaming starts
      await nextTick();
      void scrollToBottom(true); // Force scroll when streaming begins
      console.log('🌙 Luna: Auto-scrolled to bottom as streaming started');
    } else {
      // 🎯 Fix: Auto-focus input when Luna finishes responding
      await nextTick();
      if (messageInput.value) {
        messageInput.value.focus();
        console.log('🌙 Luna: Input auto-focused for seamless typing');
      }
    }
  },
  { flush: 'post' }
);
</script>

<style scoped>
.luna-streaming-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 700px; /* 🎯 Fix: Narrower width for better readability */
  margin: 0 auto; /* Center the chat */
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #e8e8e8;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 0 40px rgba(192, 132, 252, 0.2); /* Add subtle glow */
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

/* 🌙 Luna's Face Images */
.luna-face {
  position: absolute;
  inset: 5px;
  width: calc(100% - 10px);
  height: calc(100% - 10px);
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.luna-face-small {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
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

/* Custom scrollbar for messages container */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: rgba(192, 132, 252, 0.1);
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #c084fc;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #7c3aed;
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
}

/* Success Message */
.success-message {
  margin: 1rem;
  padding: 0.75rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
}

.success-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.success-text {
  flex: 1;
  color: #047857;
  font-weight: 500;
}

.success-icon {
  color: #10b981;
  font-size: 1.1rem;
}

.success-dismiss {
  background: none;
  border: none;
  color: #10b981;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.success-dismiss:hover {
  color: #047857;
  transform: scale(1.1);
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

/* 🚀 Enhanced Payment Banner */
.payment-banner {
  margin-top: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f3e8ff, #e0e7ff);
  border: 2px solid #c084fc;
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(192, 132, 252, 0.25);
  max-height: 70vh;
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* Custom scrollbar for payment banner */
.payment-banner::-webkit-scrollbar {
  width: 6px;
}

.payment-banner::-webkit-scrollbar-track {
  background: rgba(192, 132, 252, 0.1);
  border-radius: 3px;
}

.payment-banner::-webkit-scrollbar-thumb {
  background: #c084fc;
  border-radius: 3px;
}

.payment-banner::-webkit-scrollbar-thumb:hover {
  background: #7c3aed;
}

.payment-content {
  text-align: center;
}

.payment-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.payment-icon {
  font-size: 2rem;
  animation: glow 2s ease-in-out infinite alternate;
}

.payment-title-section {
  text-align: left;
}

.payment-text {
  color: #5b21b6;
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.payment-subtitle {
  color: #7c3aed;
  font-size: 0.9rem;
  margin: 0;
  opacity: 0.8;
  margin-bottom: 1rem;
}

.payment-benefits {
  margin-bottom: 1.5rem;
  text-align: left;
  display: grid;
  gap: 0.75rem;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #5b21b6;
  font-size: 0.9rem;
  font-weight: 500;
}

.benefit-icon {
  font-size: 1.1rem;
  width: 24px;
  text-align: center;
}

.payment-offer {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(124, 58, 237, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.offer-price {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.price-label {
  color: #7c3aed;
  font-size: 0.9rem;
  font-weight: 500;
}

.price-amount {
  color: #5b21b6;
  font-size: 2rem;
  font-weight: 800;
  text-shadow: 0 2px 4px rgba(124, 58, 237, 0.3);
}

.offer-subtitle {
  color: #7c3aed;
  font-size: 0.8rem;
  font-weight: 500;
  opacity: 0.9;
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

.payment-button.enhanced {
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin: 0 auto;
  min-height: 50px;
}

.payment-button:hover {
  background: linear-gradient(135deg, #6d28d9, #a855f7);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
}

.button-icon {
  font-size: 1.2rem;
}

.button-price {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 1rem;
}

.payment-guarantee {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #7c3aed;
  font-size: 0.6rem;
  font-weight: 500;
  opacity: 0.9;
}

.guarantee-icon {
  font-size: 1rem;
}

.payment-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.bdc-link-button {
  background: transparent;
  color: #7c3aed;
  border: 1px solid #7c3aed;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.bdc-link-button:hover {
  background: rgba(124, 58, 237, 0.1);
  border-color: #c084fc;
  color: #c084fc;
  transform: translateY(-1px);
}

.bdc-icon {
  font-size: 1rem;
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

/* 🚀 Payment Form Overlay */
.payment-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
  padding: 1rem;
}
</style>
