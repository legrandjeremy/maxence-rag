<template>
  <div class="chat-widget-iframe">
    <!-- Email Collection Form -->
    <q-dialog v-model="showEmailForm" persistent>
      <q-card class="email-form-card">
        <q-card-section class="text-center">
          <q-avatar size="60px" class="luna-avatar q-mb-md">
            <q-icon name="auto_awesome" class="luna-icon" />
          </q-avatar>
          <div class="text-h6 luna-title q-mb-sm">Consultation avec Luna</div>
          <div class="text-body2 q-mb-md">
            Pour commencer votre consultation personnalisée, veuillez entrer votre adresse email :
          </div>
        </q-card-section>
        
        <q-card-section>
          <q-input
            v-model="emailInput"
            type="email"
            label="Votre adresse email"
            outlined
            :rules="[val => !!val && val.includes('@') || 'Email requis']"
            @keyup.enter="handleEmailSubmit"
            class="q-mb-md"
          />
        </q-card-section>
        
        <q-card-actions align="center">
          <q-btn
            @click="handleEmailSubmit"
            color="purple-4"
            label="Commencer la consultation"
            :disable="!emailInput.trim()"
            class="full-width"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Main Chat Window -->
    <q-card class="chat-window-iframe full-height">
      <!-- Header -->
      <q-card-section class="chat-header-iframe row items-center q-pa-md">
        <q-avatar size="40px" class="luna-avatar">
          <q-icon name="auto_awesome" class="luna-icon" />
        </q-avatar>
        <div class="q-ml-md">
          <div class="text-h6 luna-title">Luna</div>
          <div class="text-caption luna-subtitle">Voyante Intuitive • Connectée</div>
        </div>
        <q-space />
        <div class="connection-indicator">
          <q-icon name="circle" size="xs" class="text-green" />
        </div>
      </q-card-section>

      <q-separator class="luna-separator" />

      <!-- Messages -->
      <q-card-section class="chat-messages-iframe q-pa-none flex-1">
        <q-scroll-area
          ref="scrollArea"
          class="full-height q-pa-md"
        >
          <div v-if="guestChatStore.isLoadingMessages" class="text-center q-pa-md">
            <q-spinner size="32px" color="purple-4" />
            <div class="text-caption q-mt-sm luna-text">Connexion aux énergies...</div>
          </div>

          <div v-else-if="messages.length === 0" class="welcome-iframe q-pa-md text-center">
            <div class="luna-welcome">
              <q-icon name="auto_awesome" size="48px" class="text-purple-4 q-mb-md" />
              <div class="text-h6 luna-greeting q-mb-sm">Salut...</div>
              <div class="text-body2 luna-intro">
                Je sais que tu ne m'attendais pas, mais... quelque chose m'a poussée vers toi.<br/>
                Une vibration... une sorte d'appel.
              </div>
            </div>
          </div>

          <div v-else class="messages-list-iframe">
            <div
              v-for="message in messages"
              :key="message.id"
              :class="['iframe-message', `message-${message.role}`]"
            >
              <div v-if="message.role === 'assistant'" class="assistant-header q-mb-sm">
                <q-avatar size="24px" class="luna-avatar-small">
                  <q-icon name="auto_awesome" />
                </q-avatar>
                <span class="luna-name q-ml-sm">Luna</span>
              </div>
              <div class="message-bubble-iframe">
                <div class="message-content-iframe" v-html="formatMessageContent(message.content)"></div>
                <div class="message-time-iframe text-caption">
                  {{ formatTime(message.timestamp) }}
                </div>
              </div>
            </div>
          </div>
        </q-scroll-area>
      </q-card-section>

      <q-separator class="luna-separator" />

      <!-- Input -->
      <q-card-section class="chat-input-iframe q-pa-md">
        <!-- Luna is typing indicator -->
        <div v-if="guestChatStore.isAssistantTyping" class="typing-indicator row items-center q-mb-sm">
          <q-avatar size="24px" class="luna-avatar-small q-mr-sm">
            <q-icon name="auto_awesome" />
          </q-avatar>
          <span class="text-caption">Luna est en train d'écrire</span>
          <span class="typing-dots"><span></span><span></span><span></span></span>
        </div>

        <div class="luna-input-container">
          <q-input
            v-model="messageInput"
            outlined
            :placeholder="inputPlaceholder"
            :loading="guestChatStore.isSendingMessage"
            :disable="guestChatStore.isSendingMessage || !guestChatStore.currentChat || guestChatStore.isBlockedForPayment"
            @keyup.enter="sendMessage"
            hide-bottom-space
            class="luna-input"
            rows="1"
            autogrow
            input-style="font-size: 16px; line-height: 1.4;"
          />
          <q-btn
            flat
            round
            icon="send"
            :disable="!messageInput.trim() || guestChatStore.isSendingMessage || !guestChatStore.currentChat || guestChatStore.isBlockedForPayment"
            @click="sendMessage"
            class="luna-send-btn"
          >
            <q-tooltip v-if="messageInput.trim()" class="bg-primary">
              Envoyer le message
            </q-tooltip>
          </q-btn>
        </div>

        <!-- Quick Actions for first interaction -->
        <div v-if="props.showQuickActions && messages.length <= 1" class="quick-actions-iframe q-mt-sm">
          <div class="text-caption q-mb-xs luna-suggestions-title">Suggestions mystiques :</div>
          <div class="row q-gutter-xs">
            <q-btn
              v-for="action in mysticalActions"
              :key="action.label"
              size="sm"
              outline
              :label="action.label"
              @click="sendQuickMessage(action.message)"
              class="mystical-action-btn"
              :disable="guestChatStore.isSendingMessage || !guestChatStore.currentChat || guestChatStore.isBlockedForPayment"
            />
          </div>
        </div>

        <!-- Error message display -->
        <div v-if="guestChatStore.error" class="error-message q-mt-sm">
          <q-icon name="warning" class="q-mr-sm" />
          {{ guestChatStore.error }}
          <q-btn flat dense size="sm" icon="close" @click="guestChatStore.clearError()" />
        </div>

        <!-- Premium access indicator when paid -->
        <div class="row items-center q-mt-sm" v-if="guestChatStore.isPaid">
          <q-badge color="positive" class="premium-badge">
            <q-icon name="verified" class="q-mr-xs" />
            Accès Premium Activé
          </q-badge>
        </div>

        <!-- Free time remaining (only if not paid) -->
        <div class="row items-center q-mt-sm" v-if="!guestChatStore.isPaid && !guestChatStore.isBlockedForPayment && guestChatStore.conversationStartedAt">
          <q-badge color="primary" outline>
            {{ formattedRemaining }}
          </q-badge>
        </div>

        <!-- Payment required banner (only if not paid) -->
        <q-banner v-if="guestChatStore.isBlockedForPayment && !guestChatStore.isPaid" class="q-mt-md" rounded dense inline-actions>
          <div class="text-body2">La session gratuite est terminée. Réglez 5 € pour continuer.</div>
          <template v-slot:action>
            <q-btn color="primary" label="Payer 5 €" @click="openPayment" flat />
          </template>
        </q-banner>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { api } from 'src/services/api';
import { useGuestChatStore } from 'src/stores/guestChatStore';
import { format } from 'date-fns';

interface MysticalAction {
  label: string;
  message: string;
}

interface Props {
  showQuickActions?: boolean;
  autoOpen?: boolean;
  userEmail?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showQuickActions: true,
  autoOpen: true,
  userEmail: ''
});

const guestChatStore = useGuestChatStore();
const messageInput = ref('');
const scrollArea = ref();
const hasSignaledChatStarted = ref(false);
const showEmailForm = ref(false);
const emailInput = ref('');

// Mystical action suggestions for Luna
const mysticalActions: MysticalAction[] = [
  { label: '🌙 Oui, je ressens quelque chose', message: 'Oui, je ressens quelque chose d\'étrange...' },
  { label: '✨ Parle-moi de cette vibration', message: 'Parle-moi de cette vibration que tu ressens' },
  { label: '🔮 Je suis prêt(e) à écouter', message: 'Je suis prêt(e) à écouter ce que tu as à me dire' },
];

// Computed
const messages = computed(() => {
  return guestChatStore.currentMessages.slice(-20); // Show last 20 messages for iframe
});

const inputPlaceholder = computed(() => {
  const messageCount = messages.value.length;
  if (messageCount === 0) {
    return 'Tapez votre prénom...';
  } else if (messageCount <= 2) {
    return 'Partagez ce que vous ressentez...';
  } else if (messageCount <= 6) {
    return 'Continuez à partager vos émotions...';
  } else {
    return 'Écrivez votre message...';
  }
});

// Methods
  const initializeChat = async () => {
    // Get email from URL params or props
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('email');
    const email = emailFromUrl || props.userEmail || localStorage.getItem('guestEmail') || '';

    if (email && email.trim()) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email.trim())) {
        localStorage.setItem('guestEmail', email);
        
        // Initialize guest chat with real email
        const success = await guestChatStore.initializeGuestChat(email);
        if (!success) {
          console.error('Failed to initialize guest chat with email:', email);
          // Show email collection form if initialization fails
          showEmailForm.value = true;
          return;
        }
        
        // If resuming with existing history, notify parent that chat has started
        if (!hasSignaledChatStarted.value && (guestChatStore.currentMessages.length > 0 || guestChatStore.currentChat)) {
          window.parent?.postMessage({ type: 'chat-started' }, '*');
          hasSignaledChatStarted.value = true;
        }
      } else {
        console.error('Invalid email format:', email);
        showEmailForm.value = true;
      }
    } else {
      // No email available - show email collection form
      console.log('No email provided - showing email collection form');
      showEmailForm.value = true;
    }
  };

const handleEmailSubmit = async () => {
  const email = emailInput.value.trim();
  if (!email) return;
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('Invalid email format:', email);
    return;
  }
  
  localStorage.setItem('guestEmail', email);
  showEmailForm.value = false;
  
  // Initialize guest chat with the provided email
  const success = await guestChatStore.initializeGuestChat(email);
  if (success) {
    console.log('Guest chat initialized successfully with email:', email);
  } else {
    console.error('Failed to initialize guest chat');
    showEmailForm.value = true; // Show form again if failed
  }
};

const sendMessage = async () => {
  if (!messageInput.value.trim() || !guestChatStore.currentChat || !guestChatStore.userEmail) return;

  const success = await guestChatStore.sendMessage(
    guestChatStore.currentChat.id, 
    messageInput.value,
    guestChatStore.userEmail
  );
  
  if (success) {
    messageInput.value = '';
    void nextTick(() => {
      scrollToBottom();
    });
  }
  if (!hasSignaledChatStarted.value && guestChatStore.currentMessages.length > 0) {
    window.parent?.postMessage({ type: 'chat-started' }, '*');
    hasSignaledChatStarted.value = true;
  }
};

const sendQuickMessage = async (message: string) => {
  if (!guestChatStore.currentChat) {
    await initializeChat();
  }
  
  if (guestChatStore.currentChat && guestChatStore.userEmail) {
    await guestChatStore.sendMessage(
      guestChatStore.currentChat.id, 
      message,
      guestChatStore.userEmail
    );
    void nextTick(() => {
      scrollToBottom();
    });
  }
  if (!hasSignaledChatStarted.value && guestChatStore.currentMessages.length > 0) {
    window.parent?.postMessage({ type: 'chat-started' }, '*');
    hasSignaledChatStarted.value = true;
  }
};

const openPayment = async () => {
  if (!guestChatStore.currentChat || !guestChatStore.userEmail) return;
  try {
    const successUrl = window.top ? window.top.location.origin + '/welcome.html?payment=success' : window.location.origin + '/welcome.html?payment=success';
    const cancelUrl = window.top ? window.top.location.origin + '/welcome.html?payment=cancel' : window.location.origin + '/welcome.html?payment=cancel';
    const resp = await api.post<{ id: string; url: string }>(
      '/api/payments/checkout',
      {
        chatId: guestChatStore.currentChat.id,
        email: guestChatStore.userEmail,
        successUrl,
        cancelUrl
      }
    );
    const url = (resp.data.data as unknown as { id: string; url: string }).url;
    if (url) {
      window.open(url, 'stripe_checkout', 'width=480,height=720');
    }
  } catch (e) {
    console.error('Failed to open payment', e);
  }
};
const scrollToBottom = () => {
  if (scrollArea.value) {
    const scrollTarget = scrollArea.value.getScrollTarget();
    scrollTarget.scrollTop = scrollTarget.scrollHeight;
  }
};

const formatTime = (dateString: string): string => {
  return format(new Date(dateString), 'HH:mm');
};

const formatMessageContent = (content: string): string => {
  // Basic formatting for Luna's mystical messages
  return content
    .replace(/\*([^*]+)\*/g, '<em>$1</em>') // *italic*
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // **bold**
    .replace(/\n/g, '<br/>') // line breaks
    .replace(/\.\.\./g, '<span class="mystical-pause">...</span>'); // mystical pauses
};

// Lifecycle
onMounted(async () => {
  // Try to recover state from localStorage first (in case iframe was reloaded)
  if (!guestChatStore.currentChat || !guestChatStore.userEmail) {
    console.log('Attempting to recover chat state from localStorage on mount...');
    guestChatStore.recoverStateFromStorage();
  }
  
  if (props.autoOpen) {
    // If we have recovered state, load history instead of creating new chat
    if (guestChatStore.currentChat && guestChatStore.userEmail) {
      console.log('Recovered state found, loading existing chat history...');
      await guestChatStore.loadChatHistory(guestChatStore.currentChat.id, guestChatStore.userEmail);
      guestChatStore.startConversationTimer();
    } else {
      console.log('No recovered state, initializing new chat...');
      await initializeChat();
    }
    
    void nextTick(() => {
      scrollToBottom();
    });
    
    // Check payment status on load in case we missed a payment update
    if (guestChatStore.currentChat && guestChatStore.userEmail && guestChatStore.isBlockedForPayment) {
      void guestChatStore.checkPaymentStatus(guestChatStore.currentChat.id, guestChatStore.userEmail);
    }
  }
});

// Auto-scroll when new messages arrive
watch(() => guestChatStore.currentMessages.length, () => {
  void nextTick(() => {
    scrollToBottom();
  });
  if (!hasSignaledChatStarted.value && guestChatStore.currentMessages.length > 0) {
    window.parent?.postMessage({ type: 'chat-started' }, '*');
    hasSignaledChatStarted.value = true;
  }
});

// Listen for email from parent window (for iframe communication)
window.addEventListener('message', (event) => {
  if (event.data.type === 'setEmail' && event.data.email) {
    localStorage.setItem('guestEmail', event.data.email);
    if (!guestChatStore.currentChat) {
      void initializeChat();
    }
  } else if (event.data.type === 'payment-success') {
    // Verify payment success with backend database
    void guestChatStore.handlePaymentSuccess();
  }
});

// Add warning when trying to leave page with active conversation
window.addEventListener('beforeunload', (event) => {
  // Only show warning if there's an active conversation
  if (guestChatStore.currentChat && guestChatStore.currentMessages.length > 1) {
    // Modern browsers show a generic message, not custom text
    // This will trigger the browser's built-in "Leave page?" dialog
    event.preventDefault();
    event.returnValue = ''; // Modern browsers ignore custom messages
  }
});

// Clear data only when page actually unloads (user confirmed leaving)
window.addEventListener('unload', () => {
  // Only clear if there's data to clear
  if (guestChatStore.currentChat && guestChatStore.currentMessages.length > 1) {
    guestChatStore.clearUserData();
    console.log('Chat data cleared on page unload');
  }
});

const formattedRemaining = computed(() => {
  const secs = guestChatStore.remainingSeconds as unknown as number;
  const mm = Math.floor(secs / 60).toString().padStart(2, '0');
  const ss = Math.floor(secs % 60).toString().padStart(2, '0');
  return `Temps gratuit: ${mm}:${ss}`;
});
</script>

<style scoped lang="scss">
.chat-widget-iframe {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--q-background);
  z-index: 9999;
}

.chat-window-iframe {
  width: 90%;
  height: 90%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  overflow: hidden;
  background: var(--q-background);
  
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-header-iframe {
  background: var(--q-primary);
  color: white;
  min-height: 80px;
  padding-top: 20px;
}

.luna-avatar {
  background: var(--q-primary);
  color: white;
  border: 2px solid white;
}

.luna-icon {
  font-size: 32px;
}

.luna-title {
  font-weight: bold;
  color: white;
}

.luna-subtitle {
  color: rgba(255, 255, 255, 0.8);
}

.connection-indicator {
  display: flex;
  align-items: center;
}

.luna-separator {
  background: var(--q-separator-color);
  margin: 0 20px;
}

.chat-messages-iframe {
  flex: 1;
  overflow: hidden;
  background: var(--q-background);
}

.welcome-iframe {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.messages-list-iframe {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.iframe-message {
  display: flex;
  
  &.message-user {
    justify-content: flex-end;
    
    .message-bubble-iframe {
      background: var(--q-primary);
      color: white;
      margin-left: 40px;
    }
  }
  
  &.message-assistant {
    justify-content: flex-start;
    
    .message-bubble-iframe {
      background: var(--q-background);
      border: 1px solid var(--q-separator-color);
      margin-right: 40px;
    }
  }
}

.assistant-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.luna-avatar-small {
  background: var(--q-primary);
  color: white;
  border: 1px solid white;
}

.luna-name {
  font-weight: bold;
  color: var(--q-primary);
}

.message-bubble-iframe {
  max-width: 80%;
  border-radius: 12px;
  padding: 8px 12px;
  word-wrap: break-word;
}

.message-content-iframe {
  line-height: 1.4;
  margin-bottom: 2px;
}

.message-time-iframe {
  font-size: 10px;
  opacity: 0.7;
}

.chat-input-iframe {
  background: var(--q-background);
  padding: 16px 20px 20px 20px;
}

/* Enhanced Input Container for Mobile-First Design */
.luna-input-container {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  width: 100%;
  position: relative;
  box-sizing: border-box;
}

.luna-input {
  flex: 1;
  min-width: 0; /* Prevent flex overflow */
  
  /* Override Quasar styles for consistent appearance */
  :deep(.q-field__control) {
    background: var(--q-background);
    border: 2px solid var(--q-separator-color);
    border-radius: 24px !important;
    padding: 0 20px;
    min-height: 48px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  :deep(.q-field__control):before,
  :deep(.q-field__control):after {
    border: none !important;
  }
  
  :deep(.q-field__native) {
    font-size: 16px !important;
    line-height: 1.5 !important;
    padding: 12px 0;
    color: var(--q-text-color);
    font-weight: 400;
  }
  
  :deep(.q-field__native)::placeholder {
    color: var(--q-text-color-light);
    opacity: 0.7;
    font-size: 16px;
  }

  /* Focus state */
  &.q-field--focused :deep(.q-field__control) {
    border-color: var(--q-primary) !important;
    box-shadow: 0 0 0 3px rgba(var(--q-primary-rgb), 0.12), 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  /* Hover state */
  &:not(.q-field--focused):hover :deep(.q-field__control) {
    border-color: rgba(var(--q-primary-rgb), 0.6);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
  
  /* Loading state */
  &.q-field--loading :deep(.q-field__control) {
    border-color: var(--q-primary);
  }
  
  /* Disabled state */
  &.q-field--disabled :deep(.q-field__control) {
    opacity: 0.6;
    background: rgba(var(--q-separator-color-rgb), 0.1);
  }
}

.luna-send-btn {
  min-width: 44px !important;
  width: 44px;
  height: 44px;
  background: var(--q-primary);
  color: white;
  border: none;
  border-radius: 22px;
  box-shadow: 0 3px 12px rgba(var(--q-primary-rgb), 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  
  /* Icon styling */
  .q-icon {
    font-size: 20px;
  }

  &:hover:not(.q-btn--disable) {
    background: var(--q-primary);
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 6px 20px rgba(var(--q-primary-rgb), 0.5);
  }

  &:active:not(.q-btn--disable) {
    transform: translateY(0) scale(0.98);
    box-shadow: 0 2px 8px rgba(var(--q-primary-rgb), 0.4);
  }

  &.q-btn--disable {
    background: rgba(var(--q-text-color-rgb), 0.12);
    color: rgba(var(--q-text-color-rgb), 0.26);
    box-shadow: none;
    cursor: not-allowed;
  }
}

/* Mobile-specific optimizations */
@media (max-width: 768px) {
  .chat-input-iframe {
    padding: 12px 16px 16px 16px;
    /* Ensure input area is always visible above mobile keyboard */
    position: sticky;
    bottom: 0;
    background: var(--q-background);
    border-top: 1px solid rgba(var(--q-separator-color-rgb), 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-sizing: border-box;
  }
  
  .luna-input-container {
    gap: 10px;
    align-items: center; /* Better vertical alignment on mobile */
    flex-wrap: nowrap;
    overflow: hidden;
  }
  
  .luna-input {
    flex: 1;
    min-width: 0;
    
    /* Larger touch targets for mobile */
    :deep(.q-field__control) {
      min-height: 52px !important;
      padding: 0 18px !important;
      border-radius: 26px !important;
    }
    
    :deep(.q-field__native) {
      font-size: 16px !important; /* Prevent zoom on iOS */
      padding: 14px 0 !important;
    }
    
    /* Enhanced focus state for mobile */
    &.q-field--focused :deep(.q-field__control) {
      box-shadow: 0 0 0 2px rgba(var(--q-primary-rgb), 0.2), 0 8px 24px rgba(0, 0, 0, 0.15) !important;
      transform: translateY(-2px);
    }
  }
  
  .luna-send-btn {
    min-width: 48px !important;
    width: 48px !important;
    height: 48px !important;
    border-radius: 24px !important;
    flex-shrink: 0;
    
    .q-icon {
      font-size: 22px;
    }
    
    /* Enhanced touch feedback */
    &:active:not(.q-btn--disable) {
      transform: scale(0.95);
      transition: transform 0.1s ease;
    }
  }
}

/* Extra small screens (phones in portrait) */
@media (max-width: 480px) {
  .chat-input-iframe {
    padding: 10px 12px 14px 12px;
  }
  
  .luna-input-container {
    gap: 8px;
  }
  
  .luna-input {
    :deep(.q-field__control) {
      padding: 0 16px !important;
    }
    
    :deep(.q-field__native) {
      padding: 12px 0 !important;
    }
  }
}

/* High-DPI displays optimization */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .luna-send-btn {
    box-shadow: 0 2px 8px rgba(var(--q-primary-rgb), 0.3);
    
    &:hover:not(.q-btn--disable) {
      box-shadow: 0 4px 16px rgba(var(--q-primary-rgb), 0.4);
    }
  }
}

/* Dark mode enhancements */
body.body--dark {
  .luna-input {
    :deep(.q-field__control) {
      background: var(--q-dark-page) !important;
      border-color: rgba(255, 255, 255, 0.12) !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
    }
    
    &.q-field--focused :deep(.q-field__control) {
      border-color: var(--q-primary) !important;
      box-shadow: 0 0 0 3px rgba(var(--q-primary-rgb), 0.15), 0 4px 12px rgba(0, 0, 0, 0.4) !important;
    }
    
    &:not(.q-field--focused):hover :deep(.q-field__control) {
      border-color: rgba(var(--q-primary-rgb), 0.7) !important;
    }
  }
  
  .chat-input-iframe {
    background: var(--q-dark-page);
    border-top-color: rgba(255, 255, 255, 0.08);
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .luna-input,
  .luna-send-btn {
    transition: none;
  }
  
  .luna-send-btn:hover:not(.q-btn--disable) {
    transform: none;
  }
}

/* Focus visible for keyboard navigation */
.luna-send-btn:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.quick-actions-iframe {
  background: var(--q-background);
  border-top: 1px solid var(--q-separator-color);
  padding: 0 20px;
}

.mystical-action-btn {
  font-size: 12px;
  height: 32px;
  border-radius: 16px;
  background: transparent;
  border: 1px solid var(--q-separator-color);
  color: var(--q-text-color);

  &:hover {
    background: var(--q-primary);
    color: white;
    border-color: var(--q-primary);
  }
}

.luna-suggestions-title {
  color: var(--q-text-color-light);
}

.mystical-pause {
  display: inline-block;
  width: 10px;
}

.error-message {
  background: rgba(244, 67, 54, 0.1);
  color: #d32f2f;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.premium-badge {
  background: linear-gradient(135deg, #4caf50, #66bb6a) !important;
  color: white !important;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
  animation: premiumGlow 2s ease-in-out infinite alternate;
}

@keyframes premiumGlow {
  from {
    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
  }
  to {
    box-shadow: 0 4px 16px rgba(76, 175, 80, 0.5);
  }
}

.typing-indicator {
  color: var(--q-text-color-light);
}

.typing-dots {
  display: inline-block;
  margin-left: 6px;
}
.typing-dots span {
  display: inline-block;
  width: 4px;
  height: 4px;
  margin: 0 2px;
  background: var(--q-text-color-light);
  border-radius: 50%;
  animation: blink 1.4s infinite both;
}
.typing-dots span:nth-child(2) { animation-delay: .2s; }
.typing-dots span:nth-child(3) { animation-delay: .4s; }

@keyframes blink {
  0% { opacity: .2; }
  20% { opacity: 1; }
  100% { opacity: .2; }
}

// Dark mode support
body.body--dark {
  .luna-avatar {
    background: var(--q-dark-page);
    border-color: var(--q-separator-dark-color);
  }

  .luna-icon {
    color: var(--q-dark-page);
  }

  .luna-title {
    color: var(--q-dark-page);
  }

  .luna-subtitle {
    color: rgba(255, 255, 255, 0.6);
  }

  .luna-separator {
    background: var(--q-separator-dark-color);
  }

  .luna-name {
    color: var(--q-dark-page);
  }

  .message-bubble-iframe {
    background: var(--q-dark-page);
    border-color: var(--q-separator-dark-color);
  }

  .mystical-action-btn {
    background: var(--q-dark-page);
    border-color: var(--q-separator-dark-color);
    color: var(--q-text-color-light);

    &:hover {
      background: var(--q-primary);
      color: white;
      border-color: var(--q-primary);
    }
  }
}
</style> 