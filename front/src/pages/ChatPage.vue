<template>
  <q-page class="chat-page">
    <div class="chat-container">
      <!-- Chat Sidebar -->
      <div class="chat-sidebar">
        <div class="sidebar-header">
          <h5 class="text-h6 q-ma-none">AI Assistant</h5>
          <q-btn
            flat
            round
            icon="add"
            size="sm"
            @click="createNewChat"
            :loading="chatStore.isLoading"
            class="new-chat-btn"
          >
            <q-tooltip>New Chat</q-tooltip>
          </q-btn>
        </div>

        <q-separator />

        <!-- Chat List -->
        <div class="chat-list">
          <q-scroll-area style="height: calc(100vh - 140px)">
            <div v-if="chatStore.isLoadingChats" class="q-pa-md text-center">
              <q-spinner size="24px" />
              <div class="text-caption q-mt-sm">Loading chats...</div>
            </div>

            <div v-else-if="!chatStore.hasChats" class="no-chats q-pa-md text-center">
              <q-icon name="chat" size="48px" class="text-grey-5" />
              <div class="text-caption text-grey-6 q-mt-sm">
                No chats yet. Start a conversation!
              </div>
            </div>

            <q-list v-else dense>
              <q-item
                v-for="chat in chatStore.chats"
                :key="chat.id"
                clickable
                :active="chatStore.currentChat?.id === chat.id"
                @click="selectChat(chat)"
                class="chat-item"
              >
                <q-item-section>
                  <q-item-label class="chat-title">{{ chat.title }}</q-item-label>
                  <q-item-label caption class="chat-date">
                    {{ formatChatDate(chat.lastMessageAt) }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-btn
                    flat
                    dense
                    round
                    icon="delete"
                    size="xs"
                    @click.stop="confirmDeleteChat(chat)"
                    class="delete-chat-btn"
                  >
                    <q-tooltip>Delete Chat</q-tooltip>
                  </q-btn>
                </q-item-section>
              </q-item>
            </q-list>
          </q-scroll-area>
        </div>
      </div>

      <q-separator vertical />

      <!-- Chat Main Area -->
      <div class="chat-main">
        <div v-if="!chatStore.currentChat" class="no-chat-selected">
          <div class="welcome-message">
            <q-icon name="smart_toy" size="64px" class="text-primary" />
            <h4 class="text-h4 q-mt-md q-mb-sm">Welcome to AI Assistant</h4>
            <p class="text-body1 text-grey-7">
              Select a chat from the sidebar or create a new one to get started.
            </p>
            <q-btn
              color="primary"
              unelevated
              label="Start New Chat"
              icon="add"
              @click="createNewChat"
              :loading="chatStore.isLoading"
            />
          </div>
        </div>

        <div v-else class="chat-content">
          <!-- Chat Header -->
          <div class="chat-header">
            <div class="chat-info">
              <h6 class="chat-title q-ma-none">{{ chatStore.currentChat.title }}</h6>
              <div class="text-caption text-grey-6">
                Created {{ formatChatDate(chatStore.currentChat.createdAt) }}
              </div>
            </div>
            <q-btn
              flat
              dense
              round
              icon="edit"
              size="sm"
              @click="editChatTitle"
            >
              <q-tooltip>Edit Title</q-tooltip>
            </q-btn>
          </div>

          <q-separator />

          <!-- Messages Area -->
          <div class="messages-container">
            <q-scroll-area
              ref="scrollArea"
              class="messages-scroll"
              :style="{ height: messagesHeight }"
            >
              <div v-if="chatStore.isLoadingMessages" class="loading-messages q-pa-md text-center">
                <q-spinner size="24px" />
                <div class="text-caption q-mt-sm">Loading messages...</div>
              </div>

              <div v-else-if="chatStore.currentMessages.length === 0" class="no-messages q-pa-md text-center">
                <q-icon name="chat_bubble_outline" size="48px" class="text-grey-5" />
                <div class="text-body2 text-grey-6 q-mt-sm">
                  Start the conversation by sending a message below.
                </div>
              </div>

              <div v-else class="messages-list q-pa-md">
                <div
                  v-for="message in chatStore.currentMessages"
                  :key="message.id"
                  :class="['message', `message-${message.role}`]"
                >
                  <div class="message-avatar">
                    <q-avatar :color="message.role === 'user' ? 'primary' : 'secondary'" text-color="white">
                      <q-icon :name="message.role === 'user' ? 'person' : 'smart_toy'" />
                    </q-avatar>
                  </div>

                  <div class="message-content">
                    <div class="message-header">
                      <span class="message-sender">
                        {{ message.role === 'user' ? 'You' : 'AI Assistant' }}
                      </span>
                      <span class="message-time text-caption text-grey-6">
                        {{ formatMessageTime(message.timestamp) }}
                      </span>
                    </div>

                    <div class="message-text" v-html="formatMessageContent(message.content)"></div>

                    <!-- Metadata for AI responses -->
                    <div v-if="message.role === 'assistant' && message.metadata" class="message-metadata">
                      <div v-if="message.metadata.confidence" class="confidence-badge">
                        <q-chip
                          :color="getConfidenceColor(message.metadata.confidence)"
                          text-color="white"
                          size="sm"
                          dense
                        >
                          {{ Math.round(message.metadata.confidence * 100) }}% confidence
                        </q-chip>
                      </div>

                      <div v-if="message.metadata.sourceDocuments?.length" class="source-docs">
                        <q-expansion-item
                          dense
                          header-class="text-caption text-grey-7"
                          label="Sources"
                          :caption="`${message.metadata.sourceDocuments.length} documents`"
                        >
                          <q-list dense>
                            <q-item
                              v-for="(source, index) in message.metadata.sourceDocuments"
                              :key="index"
                              dense
                            >
                              <q-item-section>
                                <q-item-label class="text-caption">{{ source }}</q-item-label>
                              </q-item-section>
                            </q-item>
                          </q-list>
                        </q-expansion-item>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </q-scroll-area>
          </div>

          <!-- Message Input -->
          <div class="message-input-container">
            <q-separator />
            <div class="message-input q-pa-md">
              <q-input
                v-model="messageInput"
                outlined
                placeholder="Type your message here..."
                autofocus
                :loading="chatStore.isSendingMessage"
                :disable="chatStore.isSendingMessage"
                @keyup.enter="sendMessage"
                class="message-input-field"
              >
                <template v-slot:append>
                  <q-btn
                    round
                    dense
                    flat
                    icon="send"
                    :disable="!messageInput.trim() || chatStore.isSendingMessage"
                    @click="sendMessage"
                    color="primary"
                  />
                </template>
              </q-input>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Chat Dialog -->
    <q-dialog v-model="deleteDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm">Delete this chat permanently?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            label="Delete"
            color="negative"
            @click="deleteChat"
            :loading="chatStore.isLoading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit Title Dialog -->
    <q-dialog v-model="editTitleDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Edit Chat Title</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="editTitleInput"
            outlined
            label="Chat Title"
            autofocus
            @keyup.enter="updateChatTitle"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            label="Save"
            color="primary"
            @click="updateChatTitle"
            :loading="chatStore.isLoading"
            :disable="!editTitleInput.trim()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue';
import { useChatStore, type Chat } from 'src/stores/chatStore';
import { useQuasar } from 'quasar';
import { formatDistanceToNow, format } from 'date-fns';

const $q = useQuasar();
const chatStore = useChatStore();

// Component state
const messageInput = ref('');
const deleteDialog = ref(false);
const editTitleDialog = ref(false);
const editTitleInput = ref('');
const chatToDelete = ref<Chat | null>(null);
const scrollArea = ref();

// Computed
const messagesHeight = computed(() => 'calc(100vh - 200px)');

// Methods
const createNewChat = async () => {
  const chat = await chatStore.createChat();
  if (chat) {
    $q.notify({
      type: 'positive',
      message: 'New chat created successfully',
      position: 'top'
    });
  }
};

const selectChat = (chat: Chat) => {
  chatStore.setCurrentChat(chat);
};

const sendMessage = async () => {
  if (!messageInput.value.trim() || !chatStore.currentChat) return;

  const success = await chatStore.sendMessage(chatStore.currentChat.id, messageInput.value);
  if (success) {
    messageInput.value = '';
    // Scroll to bottom after message is sent
    void nextTick(() => {
      scrollToBottom();
    });
  } else {
    $q.notify({
      type: 'negative',
      message: chatStore.error || 'Failed to send message',
      position: 'top'
    });
  }
};

const confirmDeleteChat = (chat: Chat) => {
  chatToDelete.value = chat;
  deleteDialog.value = true;
};

const deleteChat = async () => {
  if (!chatToDelete.value) return;

  const success = await chatStore.deleteChat(chatToDelete.value.id);
  if (success) {
    $q.notify({
      type: 'positive',
      message: 'Chat deleted successfully',
      position: 'top'
    });
    deleteDialog.value = false;
    chatToDelete.value = null;
  } else {
    $q.notify({
      type: 'negative',
      message: chatStore.error || 'Failed to delete chat',
      position: 'top'
    });
  }
};

const editChatTitle = () => {
  if (!chatStore.currentChat) return;
  editTitleInput.value = chatStore.currentChat.title;
  editTitleDialog.value = true;
};

const updateChatTitle = async () => {
  if (!chatStore.currentChat || !editTitleInput.value.trim()) return;

  const success = await chatStore.updateChatTitle(chatStore.currentChat.id, editTitleInput.value.trim());
  if (success) {
    $q.notify({
      type: 'positive',
      message: 'Chat title updated successfully',
      position: 'top'
    });
    editTitleDialog.value = false;
  } else {
    $q.notify({
      type: 'negative',
      message: chatStore.error || 'Failed to update chat title',
      position: 'top'
    });
  }
};

const scrollToBottom = () => {
  if (scrollArea.value) {
    const scrollTarget = scrollArea.value.getScrollTarget();
    scrollTarget.scrollTop = scrollTarget.scrollHeight;
  }
};

const formatChatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return formatDistanceToNow(date, { addSuffix: true });
  } else {
    return format(date, 'MMM d, yyyy');
  }
};

const formatMessageTime = (dateString: string): string => {
  return format(new Date(dateString), 'h:mm a');
};

const formatMessageContent = (content: string): string => {
  // Basic markdown-like formatting
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
};

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return 'positive';
  if (confidence >= 0.6) return 'warning';
  return 'negative';
};

// Lifecycle
onMounted(async () => {
  await chatStore.loadChats();
});
</script>

<style scoped lang="scss">
.chat-page {
  height: 100vh;
  overflow: hidden;
}

.chat-container {
  display: flex;
  height: 100vh;
}

.chat-sidebar {
  width: 300px;
  min-width: 300px;
  background: var(--q-background);
  border-right: 1px solid var(--q-separator-color);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.new-chat-btn {
  color: var(--q-primary);
}

.chat-list {
  flex: 1;
  overflow: hidden;
}

.no-chats {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.chat-item {
  &.q-item--active {
    background: var(--q-primary);
    color: white;

    .chat-title, .chat-date {
      color: white;
    }
  }

  &:hover {
    .delete-chat-btn {
      opacity: 1;
    }
  }
}

.chat-title {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-date {
  font-size: 11px;
}

.delete-chat-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--q-background);
}

.no-chat-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-message {
  text-align: center;
  max-width: 400px;
  padding: 32px;
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.chat-header {
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--q-background);
}

.chat-info {
  flex: 1;
}

.messages-container {
  flex: 1;
  overflow: hidden;
}

.messages-scroll {
  width: 100%;
}

.loading-messages, .no-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.messages-list {
  padding-bottom: 24px;
}

.message {
  display: flex;
  margin-bottom: 24px;
  animation: fadeIn 0.3s ease-in;

  &.message-user {
    flex-direction: row-reverse;

    .message-content {
      margin-right: 12px;
      margin-left: 48px;
    }

    .message-text {
      background: var(--q-primary);
      color: white;
    }
  }

  &.message-assistant {
    .message-content {
      margin-left: 12px;
      margin-right: 48px;
    }

    .message-text {
      background: var(--q-background);
      border: 1px solid var(--q-separator-color);
    }
  }
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
}

.message-sender {
  font-weight: 600;
  font-size: 14px;
}

.message-time {
  font-size: 11px;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  word-wrap: break-word;
  line-height: 1.4;

  :deep(strong) {
    font-weight: 600;
  }

  :deep(em) {
    font-style: italic;
  }
}

.message-metadata {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.confidence-badge {
  align-self: flex-start;
}

.source-docs {
  max-width: 300px;
}

.message-input-container {
  background: var(--q-background);
}

.message-input {
  max-width: 100%;
}

.message-input-field {
  .q-field__control {
    border-radius: 24px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Dark mode adjustments
body.body--dark {
  .message-assistant .message-text {
    background: var(--q-dark-page);
    border-color: var(--q-separator-dark-color);
  }
}

// Responsive design
@media (max-width: 768px) {
  .chat-sidebar {
    width: 100%;
    position: absolute;
    left: -100%;
    z-index: 1000;
    transition: left 0.3s;

    &.open {
      left: 0;
    }
  }

  .chat-main {
    width: 100%;
  }
}
</style> 