<template>
  <div class="chat-widget-iframe">
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

        <q-input
          v-model="messageInput"
          outlined
          :placeholder="inputPlaceholder"
          :loading="guestChatStore.isSendingMessage"
          :disable="guestChatStore.isSendingMessage || !guestChatStore.currentChat"
          @keyup.enter="sendMessage"
          hide-bottom-space
          class="luna-input"
        >
          <template v-slot:append>
            <q-btn
              flat
              dense
              round
              icon="send"
              size="md"
              :disable="!messageInput.trim() || guestChatStore.isSendingMessage || !guestChatStore.currentChat"
              @click="sendMessage"
              class="luna-send-btn"
            />
          </template>
        </q-input>

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
              :disable="guestChatStore.isSendingMessage || !guestChatStore.currentChat"
            />
          </div>
        </div>

        <!-- Error message display -->
        <div v-if="guestChatStore.error" class="error-message q-mt-sm">
          <q-icon name="warning" class="q-mr-sm" />
          {{ guestChatStore.error }}
          <q-btn flat dense size="sm" icon="close" @click="guestChatStore.clearError()" />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
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

    if (!email) {
      console.error('No email provided for guest chat');
      guestChatStore.error = 'Email requis pour la consultation';
      return;
    }

    // Store email for future use (no chat id persistence)
    localStorage.setItem('guestEmail', email);

    // Initialize or resume guest chat
    const success = await guestChatStore.initializeGuestChat(email);
    if (!success) {
      console.error('Failed to initialize guest chat');
    }
  // If resuming with existing history, notify parent that chat has started
  if (!hasSignaledChatStarted.value && (guestChatStore.currentMessages.length > 0 || guestChatStore.currentChat)) {
    window.parent?.postMessage({ type: 'chat-started' }, '*');
    hasSignaledChatStarted.value = true;
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
  if (props.autoOpen) {
    await initializeChat();
    void nextTick(() => {
      scrollToBottom();
    });
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
  }
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
  padding-bottom: 20px;
}

.luna-input {
  background: var(--q-background);
  border: 1px solid var(--q-separator-color);
  border-radius: 12px;
  padding: 0 16px;
  font-size: 16px;
  color: var(--q-text-color);

  &::placeholder {
    color: var(--q-text-color-light);
  }

  &:focus {
    border-color: var(--q-primary);
  }
}

.luna-send-btn {
  color: var(--q-primary);
  border-radius: 12px;
  background: var(--q-background);
  border: 1px solid var(--q-separator-color);

  &:hover {
    background: var(--q-primary);
    color: white;
  }
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