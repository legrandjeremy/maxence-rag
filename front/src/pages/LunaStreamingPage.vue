<template>
  <q-page class="luna-streaming-page">
    <div class="page-container">
      <!-- Header with Luna Branding -->
      <div class="page-header">
        <div class="luna-brand">
          <div class="brand-icon">
            <div class="mystical-circle">
              <span class="luna-emoji">🌙</span>
            </div>
          </div>
          <div class="brand-text">
            <h1 class="brand-title">Luna</h1>
            <p class="brand-subtitle">Oracle des Lignes Cachées</p>
          </div>
        </div>
        
        <!-- Connection Status & Controls -->
        <div class="header-controls">
          <div class="connection-badge" :class="connectionStatusClass">
            <q-icon :name="connectionIcon" class="connection-icon" />
            <span class="connection-text">{{ connectionStatusText }}</span>
          </div>
          
          <q-btn-group class="control-buttons">
            <q-btn
              flat
              icon="refresh"
              @click="resetChat"
              :disable="isProcessing"
              class="reset-btn"
            >
              <q-tooltip>Nouvelle consultation</q-tooltip>
            </q-btn>
            
            <q-btn
              flat
              icon="settings"
              @click="showSettings = true"
              class="settings-btn"
            >
              <q-tooltip>Paramètres</q-tooltip>
            </q-btn>
          </q-btn-group>
        </div>
      </div>

      <!-- Main Chat Area -->
      <div class="chat-area">
        <LunaStreamingChat
          v-bind="currentChatId ? { 'chat-id': currentChatId } : {}"
          :initial-history="initialHistory"
          @conversation-updated="handleConversationUpdate"
          @connection-changed="handleConnectionChange"
          class="luna-chat"
        />
      </div>

      <!-- Settings Dialog -->
      <q-dialog v-model="showSettings" class="settings-dialog">
        <q-card class="settings-card">
          <q-card-section class="dialog-header">
            <div class="text-h6">Paramètres de Luna</div>
            <q-btn flat round dense icon="close" v-close-popup />
          </q-card-section>

          <q-separator />

          <q-card-section class="settings-content">
            <div class="setting-group">
              <h6 class="setting-title">Expérience de Chat</h6>
              
              <q-toggle
                v-model="settings.autoSave"
                label="Sauvegarde automatique des conversations"
                color="primary"
                class="setting-item"
              />
              
              <q-toggle
                v-model="settings.soundEnabled"
                label="Sons de notification"
                color="primary"
                class="setting-item"
              />
              
              <q-toggle
                v-model="settings.reasoningByDefault"
                label="Mode réflexion activé par défaut"
                color="primary"
                class="setting-item"
              />
            </div>

            <div class="setting-group hidden">
              <h6 class="setting-title">Connexion WebSocket</h6>
              
              <q-input
                v-model="settings.wsEndpoint"
                label="URL WebSocket personnalisée"
                hint="Laissez vide pour utiliser l'endpoint par défaut"
                outlined
                dense
                class="setting-item"
              />
              
              <div class="connection-info">
                <q-chip 
                  :color="connectionStatusClass === 'connected' ? 'positive' : 'negative'"
                  text-color="white"
                  :icon="connectionIcon"
                  class="status-chip"
                >
                  {{ connectionStatusText }}
                </q-chip>
              </div>
            </div>

            <div class="setting-group">
              <h6 class="setting-title">Données</h6>
              
              <q-btn
                outline
                color="warning"
                icon="delete_sweep"
                label="Effacer l'historique local"
                @click="clearLocalHistory"
                class="setting-item"
              />
              
              <q-btn
                outline
                color="primary"
                icon="download"
                label="Exporter les conversations"
                @click="exportConversations"
                class="setting-item"
              />
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right" class="dialog-actions">
            <q-btn flat label="Fermer" color="primary" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Conversation Stats (when available) -->
      <div v-if="conversationStats" class="stats-footer">
        <div class="stats-container hidden">
          <div class="stat-item">
            <q-icon name="chat_bubble" class="stat-icon" />
            <span class="stat-text">{{ conversationStats.totalMessages }} messages</span>
          </div>
          
          <div v-if="conversationStats.totalTokens" class="stat-item">
            <q-icon name="data_usage" class="stat-icon" />
            <span class="stat-text">{{ conversationStats.totalTokens }} tokens</span>
          </div>
          
          <div v-if="conversationStats.totalCost" class="stat-item">
            <q-icon name="attach_money" class="stat-icon" />
            <span class="stat-text">${{ conversationStats.totalCost.toFixed(4) }}</span>
          </div>
          
          <div class="stat-item">
            <q-icon name="schedule" class="stat-icon" />
            <span class="stat-text">{{ formatDuration(conversationStats.duration) }}</span>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
// import { useRouter } from 'vue-router'; // Commented out - not used currently
import { useQuasar } from 'quasar';
// import { useAuthStore } from '../stores/authStore'; // Commented out - not used currently
import LunaStreamingChat from '../components/LunaStreamingChat.vue';

// Composables
const $q = useQuasar();
// const router = useRouter(); // Commented out - not used currently
// const authStore = useAuthStore(); // Commented out - not used currently

// Reactive state
const showSettings = ref(false);
const currentChatId = ref<string>();
const connectionStatus = ref('disconnected');
interface ConversationStats {
  messageCount: number;
  timestamp: number;
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  duration: number;
  lastActivity: number;
}

const conversationStats = ref<ConversationStats | null>(null);
const sessionStartTime = ref(Date.now());

const initialHistory = ref<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

const settings = reactive({
  autoSave: true,
  soundEnabled: false,
  reasoningByDefault: false,
  wsEndpoint: ''
});

// Computed properties
const connectionStatusClass = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return 'connected';
    case 'connecting': return 'connecting';
    case 'error': return 'error';
    default: return 'disconnected';
  }
});

const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return 'Connexion mystique établie';
    case 'connecting': return 'Établissement de la connexion...';
    case 'error': return 'Erreur de connexion avec Luna';
    default: return 'En attente de connexion';
  }
});

const connectionIcon = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return 'cloud_done';
    case 'connecting': return 'cloud_sync';
    case 'error': return 'cloud_off';
    default: return 'cloud_queue';
  }
});

const isProcessing = computed(() => 
  connectionStatus.value === 'connecting'
);

// Methods
const handleConnectionChange = (status: string) => {
  connectionStatus.value = status;
  
  if (status === 'error') {
    $q.notify({
      type: 'negative',
      message: '⚠️ Problème de connexion avec Luna',
      position: 'top',
      timeout: 3000
    });
  }
};

// Unused interface - kept for potential future use
// interface MessageWithMetrics {
//   tokens?: {
//     input?: number;
//     output?: number;
//   };
//   price?: number;
// }

interface ComponentConversationSummary {
  id: string | undefined;
  title: string;
  messageCount: number;
  timestamp: number;
}

// Unused interface - kept for potential future use
// interface ConversationSummary {
//   totalMessages: number;
//   messages: MessageWithMetrics[];
//   lastActivity: number;
// }

const handleConversationUpdate = (summary: ComponentConversationSummary) => {
  conversationStats.value = {
    messageCount: summary.messageCount,
    timestamp: summary.timestamp,
    totalMessages: summary.messageCount,
    totalTokens: 0, // Would need to be calculated from messages
    totalCost: 0, // Would need to be calculated from messages  
    duration: Date.now() - sessionStartTime.value,
    lastActivity: summary.timestamp
  };

  // Auto-save if enabled
  if (settings.autoSave) {
    // For now, create a simple conversation record
    const conversationRecord = {
      id: summary.id || `chat_${Date.now()}`,
      title: summary.title,
      messageCount: summary.messageCount,
      timestamp: summary.timestamp
    };
    saveConversationLocally(conversationRecord);
  }
};

const resetChat = () => {
  $q.dialog({
    title: 'Nouvelle consultation',
    message: 'Êtes-vous sûr de vouloir commencer une nouvelle consultation avec Luna ?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    currentChatId.value = undefined;
    initialHistory.value = [];
    conversationStats.value = null;
    sessionStartTime.value = Date.now();
    
    $q.notify({
      type: 'info',
      message: '🌟 Nouvelle consultation commencée',
      position: 'top',
      timeout: 2000
    });
  });
};

const clearLocalHistory = () => {
  $q.dialog({
    title: 'Effacer l\'historique',
    message: 'Cette action supprimera définitivement tout l\'historique des conversations stocké localement.',
    cancel: true,
    persistent: true,
    color: 'negative'
  }).onOk(() => {
    localStorage.removeItem('luna_conversations');
    localStorage.removeItem('luna_settings');
    
    $q.notify({
      type: 'positive',
      message: '🗑️ Historique local effacé',
      position: 'top',
      timeout: 2000
    });
  });
};

const exportConversations = () => {
  try {
    const conversations = localStorage.getItem('luna_conversations');
    if (!conversations) {
      $q.notify({
        type: 'warning',
        message: 'Aucune conversation à exporter',
        position: 'top'
      });
      return;
    }

    const dataStr = JSON.stringify(JSON.parse(conversations), null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `luna_conversations_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(link.href);
    
    $q.notify({
      type: 'positive',
      message: '💾 Conversations exportées',
      position: 'top',
      timeout: 2000
    });
  } catch (error) {
    console.error('Export error:', error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'export',
      position: 'top'
    });
  }
};

interface SavedConversation {
  id: string;
  timestamp: number;
  [key: string]: unknown;
}

const saveConversationLocally = (summary: ComponentConversationSummary) => {
  try {
    const conversations: SavedConversation[] = JSON.parse(localStorage.getItem('luna_conversations') || '[]');
    const existingIndex = conversations.findIndex((c: SavedConversation) => c.id === currentChatId.value);
    
    const conversationData = {
      id: currentChatId.value || `chat_${Date.now()}`,
      timestamp: Date.now(),
      summary,
      stats: conversationStats.value
    };
    
    if (existingIndex >= 0) {
      conversations[existingIndex] = conversationData;
    } else {
      conversations.push(conversationData);
    }
    
    // Keep only last 50 conversations
    if (conversations.length > 50) {
      conversations.splice(0, conversations.length - 50);
    }
    
    localStorage.setItem('luna_conversations', JSON.stringify(conversations));
  } catch (error) {
    console.error('Save error:', error);
  }
};

const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem('luna_settings');
    if (savedSettings) {
      Object.assign(settings, JSON.parse(savedSettings));
    }
  } catch (error) {
    console.error('Settings load error:', error);
  }
};

const saveSettings = () => {
  try {
    localStorage.setItem('luna_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Settings save error:', error);
  }
};

const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Lifecycle
onMounted(() => {
  // Load settings
  loadSettings();

  console.log('🌙 Luna Streaming Page initialized PROCESS ENV');
  console.log(process.env)

  // Generate new chat ID
  currentChatId.value = `luna_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log('🌙 Luna Streaming Page initialized');
});

onUnmounted(() => {
  saveSettings();
  console.log('🌙 Luna Streaming Page cleanup');
});

// Watch settings changes
import { watch } from 'vue';
watch(settings, () => {
  saveSettings();
}, { deep: true });
</script>

<style scoped>
.luna-streaming-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #2d1b69 100%);
  color: #e8e8e8;
}

.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* Header Styles */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.luna-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand-icon {
  position: relative;
}

.mystical-circle {
  width: 60px;
  height: 60px;
  background: conic-gradient(from 0deg, #4f46e5, #06b6d4, #10b981, #f59e0b, #ef4444, #4f46e5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: rotate 8s linear infinite;
  position: relative;
}

.mystical-circle::before {
  content: '';
  position: absolute;
  inset: 3px;
  background: #0f0f23;
  border-radius: 50%;
}

.luna-emoji {
  font-size: 2rem;
  position: relative;
  z-index: 1;
}

.brand-text {
  flex: 1;
}

.brand-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: #94a3b8;
  font-weight: 500;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.connection-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  transition: all 0.3s;
}

.connection-badge.connected {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.2);
}

.connection-badge.connecting {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.2);
}

.connection-badge.error {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.2);
}

.connection-icon {
  font-size: 1.125rem;
}

.connection-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.control-buttons {
  border-radius: 0.5rem;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
}

.reset-btn, .settings-btn {
  color: #e8e8e8;
  transition: background 0.2s;
}

.reset-btn:hover, .settings-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Chat Area */
.chat-area {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.luna-chat {
  flex: 1;
}

/* Settings Dialog */
.settings-card {
  width: 500px;
  max-width: 90vw;
  background: linear-gradient(135deg, #1a1a3e, #2d1b69);
  color: #e8e8e8;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.3);
}

.settings-content {
  max-height: 60vh;
  overflow-y: auto;
}

.setting-group {
  margin-bottom: 2rem;
}

.setting-title {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #f8fafc;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
}

.setting-item {
  margin-bottom: 1rem;
}

.connection-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.status-chip {
  font-size: 0.75rem;
}

.dialog-actions {
  background: rgba(0, 0, 0, 0.3);
}

/* Stats Footer */
.stats-footer {
  padding: 0.75rem 2rem;
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.stats-container {
  display: flex;
  align-items: center;
  gap: 2rem;
  justify-content: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #94a3b8;
}

.stat-icon {
  font-size: 1rem;
  opacity: 0.7;
}

.stat-text {
  font-weight: 500;
}

/* Animations */
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }

  .luna-brand {
    justify-content: center;
  }

  .header-controls {
    justify-content: center;
  }

  .stats-container {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .stats-footer {
    padding: 0.75rem 1rem;
  }
}
</style>
