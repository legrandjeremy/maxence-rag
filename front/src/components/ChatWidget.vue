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
          <div v-if="chatStore.isLoadingMessages" class="text-center q-pa-md">
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
        <div v-if="chatStore.isAssistantTyping" class="typing-indicator row items-center q-mb-sm">
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
            :loading="chatStore.isSendingMessage"
            :disable="chatStore.isSendingMessage"
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
            :disable="!messageInput.trim() || chatStore.isSendingMessage"
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
              :disable="chatStore.isSendingMessage"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useChatStore } from 'src/stores/chatStore';
import { format } from 'date-fns';

interface MysticalAction {
  label: string;
  message: string;
}

interface Props {
  showQuickActions?: boolean;
  autoOpen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showQuickActions: true,
  autoOpen: true
});

const chatStore = useChatStore();
const messageInput = ref('');
const scrollArea = ref();

// Mystical action suggestions for Luna
const mysticalActions: MysticalAction[] = [
  { label: '🌙 Oui, je ressens quelque chose', message: 'Oui, je ressens quelque chose d\'étrange...' },
  { label: '✨ Parle-moi de cette vibration', message: 'Parle-moi de cette vibration que tu ressens' },
  { label: '🔮 Je suis prêt(e) à écouter', message: 'Je suis prêt(e) à écouter ce que tu as à me dire' },
];

// Computed
const messages = computed(() => chatStore.currentMessages.slice(-20));

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
  // Try to load existing chats first
  await chatStore.loadChats();
  
  if (chatStore.chats.length > 0) {
    // Use the most recent chat
    const mostRecentChat = chatStore.chats[0];
    if (mostRecentChat) {
      chatStore.setCurrentChat(mostRecentChat);
    }
  } else {
    // Create a new chat with Luna
    await chatStore.createChat({ title: 'Consultation avec Luna' });
  }
};

const sendMessage = async () => {
  if (!messageInput.value.trim() || !chatStore.currentChat) return;

  const success = await chatStore.sendMessage(chatStore.currentChat.id, messageInput.value);
  if (success) {
    messageInput.value = '';
    void nextTick(() => {
      scrollToBottom();
    });
  }
};

const sendQuickMessage = async (message: string) => {
  if (!chatStore.currentChat) {
    await initializeChat();
  }
  
  if (chatStore.currentChat) {
    await chatStore.sendMessage(chatStore.currentChat.id, message);
    void nextTick(() => {
      scrollToBottom();
    });
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
watch(() => chatStore.currentMessages.length, () => {
  void nextTick(() => {
    scrollToBottom();
  });
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

/* Focus visible for keyboard navigation */
.luna-send-btn:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
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