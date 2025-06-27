<template>
  <div class="chat-widget" :class="{ 'open': isOpen }">
    <!-- Chat Toggle Button -->
    <q-btn
      v-if="!isOpen"
      fab
      color="primary"
      icon="smart_toy"
      class="chat-toggle-btn"
      @click="toggleChat"
    >
      <q-badge v-if="unreadCount > 0" floating color="red">{{ unreadCount }}</q-badge>
    </q-btn>

    <!-- Chat Window -->
    <q-card v-if="isOpen" class="chat-window">
      <!-- Header -->
      <q-card-section class="chat-header row items-center q-pa-sm">
        <q-avatar size="32px" color="primary" text-color="white">
          <q-icon name="smart_toy" />
        </q-avatar>
        <div class="q-ml-sm">
          <div class="text-subtitle2">AI Assistant</div>
          <div class="text-caption text-grey-6">Online</div>
        </div>
        <q-space />
        <q-btn
          flat
          dense
          round
          icon="minimize"
          size="sm"
          @click="toggleChat"
        />
        <q-btn
          flat
          dense
          round
          icon="close"
          size="sm"
          @click="closeChat"
        />
      </q-card-section>

      <q-separator />

      <!-- Messages -->
      <q-card-section class="chat-messages q-pa-none">
        <q-scroll-area
          ref="scrollArea"
          style="height: 300px"
          class="q-pa-sm"
        >
          <div v-if="chatStore.isLoadingMessages" class="text-center q-pa-md">
            <q-spinner size="24px" />
            <div class="text-caption q-mt-sm">Loading...</div>
          </div>

          <div v-else-if="messages.length === 0" class="welcome-widget q-pa-md text-center">
            <q-icon name="waving_hand" size="32px" class="text-primary" />
            <div class="text-body2 q-mt-sm">Hi! How can I help you today?</div>
          </div>

          <div v-else class="messages-list">
            <div
              v-for="message in messages"
              :key="message.id"
              :class="['widget-message', `message-${message.role}`]"
            >
              <div class="message-bubble">
                <div class="message-content">{{ message.content }}</div>
                <div class="message-time text-caption">
                  {{ formatTime(message.timestamp) }}
                </div>
              </div>
            </div>
          </div>
        </q-scroll-area>
      </q-card-section>

      <q-separator />

      <!-- Input -->
      <q-card-section class="chat-input q-pa-sm">
        <q-input
          v-model="messageInput"
          outlined
          dense
          placeholder="Type a message..."
          :loading="chatStore.isSendingMessage"
          :disable="chatStore.isSendingMessage"
          @keyup.enter="sendMessage"
          hide-bottom-space
        >
          <template v-slot:append>
            <q-btn
              flat
              dense
              round
              icon="send"
              size="sm"
              :disable="!messageInput.trim() || chatStore.isSendingMessage"
              @click="sendMessage"
              color="primary"
            />
          </template>
        </q-input>
      </q-card-section>

      <!-- Quick Actions -->
      <q-card-section class="quick-actions q-pa-xs">
        <div class="row q-gutter-xs">
          <q-btn
            v-for="action in quickActions"
            :key="action.label"
            size="xs"
            flat
            :label="action.label"
            @click="sendQuickMessage(action.message)"
            class="quick-action-btn"
            :disable="chatStore.isSendingMessage"
          />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useChatStore } from 'src/stores/chatStore';
import { format } from 'date-fns';

interface QuickAction {
  label: string;
  message: string;
}

interface Props {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showQuickActions?: boolean;
  autoOpen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  position: 'bottom-right',
  showQuickActions: true,
  autoOpen: false
});

const chatStore = useChatStore();
const isOpen = ref(props.autoOpen);
const messageInput = ref('');
const scrollArea = ref();
const unreadCount = ref(0);

// Quick action suggestions
const quickActions: QuickAction[] = [
  { label: 'Help', message: 'I need help with something' },
  { label: 'FAQ', message: 'Show me frequently asked questions' },
  { label: 'Support', message: 'I need technical support' },
];

// Computed
const messages = computed(() => {
  return chatStore.currentMessages.slice(-10); // Show last 10 messages
});

// Methods
const toggleChat = async () => {
  isOpen.value = !isOpen.value;
  
  if (isOpen.value) {
    unreadCount.value = 0;
    
    // Create a chat if none exists or load existing
    if (!chatStore.currentChat) {
      await initializeChat();
    }
    
    // Scroll to bottom
    void nextTick(() => {
      scrollToBottom();
    });
  }
};

const closeChat = () => {
  isOpen.value = false;
};

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
    // Create a new chat
    await chatStore.createChat({ title: 'Quick Chat' });
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

// Watch for new messages when widget is closed
watch(() => chatStore.currentMessages.length, (newLength, oldLength) => {
  if (!isOpen.value && newLength > oldLength) {
    unreadCount.value++;
  }
});

// Lifecycle
onMounted(async () => {
  if (props.autoOpen) {
    await initializeChat();
  }
});
</script>

<style scoped lang="scss">
.chat-widget {
  position: fixed;
  z-index: 9999;
  
  &.bottom-right {
    bottom: 20px;
    right: 20px;
  }
  
  &.bottom-left {
    bottom: 20px;
    left: 20px;
  }
  
  &.top-right {
    top: 20px;
    right: 20px;
  }
  
  &.top-left {
    top: 20px;
    left: 20px;
  }
}

.chat-toggle-btn {
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  
  &:hover {
    transform: scale(1.05);
  }
  
  transition: transform 0.2s ease;
}

.chat-window {
  width: 350px;
  height: 500px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  overflow: hidden;
  
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

.chat-header {
  background: var(--q-primary);
  color: white;
  min-height: 60px;
}

.chat-messages {
  flex: 1;
  overflow: hidden;
  background: var(--q-background);
}

.welcome-widget {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.messages-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.widget-message {
  display: flex;
  
  &.message-user {
    justify-content: flex-end;
    
    .message-bubble {
      background: var(--q-primary);
      color: white;
      margin-left: 40px;
    }
  }
  
  &.message-assistant {
    justify-content: flex-start;
    
    .message-bubble {
      background: var(--q-background);
      border: 1px solid var(--q-separator-color);
      margin-right: 40px;
    }
  }
}

.message-bubble {
  max-width: 80%;
  border-radius: 12px;
  padding: 8px 12px;
  word-wrap: break-word;
}

.message-content {
  line-height: 1.4;
  margin-bottom: 2px;
}

.message-time {
  font-size: 10px;
  opacity: 0.7;
}

.chat-input {
  background: var(--q-background);
}

.quick-actions {
  background: var(--q-background);
  border-top: 1px solid var(--q-separator-color);
}

.quick-action-btn {
  font-size: 11px;
  height: 24px;
  border-radius: 12px;
  background: var(--q-background);
  border: 1px solid var(--q-separator-color);
  
  &:hover {
    background: var(--q-primary);
    color: white;
  }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .chat-window {
    width: calc(100vw - 40px);
    height: calc(100vh - 100px);
    max-width: 350px;
  }
  
  .chat-widget {
    &.bottom-right, &.bottom-left {
      bottom: 10px;
      right: 10px;
      left: 10px;
      display: flex;
      justify-content: flex-end;
    }
  }
}

// Dark mode support
body.body--dark {
  .quick-action-btn {
    background: var(--q-dark-page);
    border-color: var(--q-separator-dark-color);
  }
  
  .widget-message.message-assistant .message-bubble {
    background: var(--q-dark-page);
    border-color: var(--q-separator-dark-color);
  }
}
</style> 