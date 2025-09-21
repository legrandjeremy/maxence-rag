<template>
  <div class="luna-login-overlay" @click.self="$emit('close')">
    <div class="luna-login-card">
      <div class="login-header">
        <div class="luna-avatar">
          <img src="~assets/Luna.png" alt="Luna" class="luna-face" />
        </div>
        <h2 class="login-title">Retrouvez votre session avec Luna</h2>
        <p class="login-subtitle">
          Entrez votre adresse email pour récupérer vos conversations précédentes
        </p>
      </div>

      <div class="login-form">
        <div class="form-group">
          <label for="email" class="form-label">Adresse email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-input"
            placeholder="votre.email@exemple.com"
            :disabled="isLoading"
            @keydown.enter="handleLogin"
            ref="emailInput"
          />
        </div>

        <div v-if="error" class="error-message">
          <span class="error-icon">⚠️</span>
          <span class="error-text">{{ error }}</span>
        </div>

        <div v-if="emailSent" class="email-sent-message">
          <div class="success-icon">📧</div>
          <h3 class="success-title">Email envoyé !</h3>
          <p class="success-text">
            Un email contenant vos liens de connexion a été envoyé à <strong>{{ email }}</strong>.
            Vérifiez votre boîte de réception et cliquez sur le lien pour accéder à vos conversations.
          </p>
          <div class="email-note">
            <span class="note-icon">💡</span>
            <span>Le lien expire dans 24 heures pour votre sécurité.</span>
          </div>
        </div>

        <div class="form-actions" v-if="!emailSent">
          <button
            @click="handleLogin"
            :disabled="!email.trim() || isLoading"
            class="login-button"
            :class="{ loading: isLoading }"
          >
            <span v-if="!isLoading">📧 Recevoir mes liens de connexion</span>
            <span v-else>🌙 Envoi en cours...</span>
          </button>

          <button @click="startNewSession" class="new-session-button">
            ✨ Commencer une nouvelle session
          </button>
        </div>
        
        <div class="form-actions" v-else>
          <button @click="resetForm" class="reset-button">
            ← Essayer une autre adresse email
          </button>
          <button @click="$emit('close')" class="close-button-action">
            Fermer
          </button>
        </div>
      </div>

      <button @click="$emit('close')" class="close-button">✕</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { api } from '../services/api';

// Interfaces removed - no longer needed since we send email instead of showing chat list

const emit = defineEmits<{
  'login-success': [{ email: string }];
  'start-new-session': [];
  'close': [];
}>();

// Reactive state
const email = ref('');
const isLoading = ref(false);
const error = ref('');
const emailSent = ref(false);
const emailInput = ref<HTMLInputElement>();

// Methods
const handleLogin = async () => {
  if (!email.value.trim()) return;

  isLoading.value = true;
  error.value = '';
  emailSent.value = false;

  try {
    const userEmail = email.value.trim().toLowerCase();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      error.value = 'Veuillez entrer une adresse email valide';
      return;
    }

    console.log('🌙 Luna Login: Sending signin email to:', userEmail);

    // Call the new send signin email endpoint
    const response = await api.post('/api/guest-chat/send-signin-email', {
      email: userEmail
    });

    if (response.data && response.status === 200) {
      emailSent.value = true;
      console.log('🌙 Luna Login: Signin email sent successfully');
    } else {
      error.value = 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.';
    }

  } catch (err) {
    console.error('🚨 Luna Login: Error sending signin email:', err);
    if (err instanceof Error && err.message.includes('404')) {
      error.value = 'Aucune conversation trouvée pour cette adresse email. Vous pouvez commencer une nouvelle session.';
    } else {
      error.value = 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.';
    }
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  email.value = '';
  error.value = '';
  emailSent.value = false;
  isLoading.value = false;
  
  // Focus the email input
  nextTick(() => {
    emailInput.value?.focus();
  });
};

const startNewSession = () => {
  console.log('🌙 Luna Login: Starting new session');
  
  // Clear any existing session data for fresh start
  localStorage.removeItem('guestChat_userEmail');
  localStorage.removeItem('luna_customer_info');
  localStorage.removeItem('luna_current_session_id');
  localStorage.removeItem('luna_database_chat_id');
  
  // Emit start-new-session to show welcome form
  emit('start-new-session');
};

// formatDate function removed - no longer needed since we don't show chat list

// Lifecycle
onMounted(async () => {
  // Auto-fill email if available from localStorage
  const savedEmail = localStorage.getItem('guestChat_userEmail');
  if (savedEmail) {
    email.value = savedEmail;
  }

  // Focus input
  await nextTick();
  emailInput.value?.focus();
});
</script>

<style scoped>
.luna-login-overlay {
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

.luna-login-card {
  background: linear-gradient(135deg, #1a1a3e, #2d1b69);
  border-radius: 20px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  color: #e8e8e8;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.luna-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  position: relative;
}

.luna-face {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(79, 70, 229, 0.5);
  box-shadow: 0 0 20px rgba(79, 70, 229, 0.3);
}

.login-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: #94a3b8;
  line-height: 1.4;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #c084fc;
}

.form-input {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  color: #f8fafc;
  font-family: inherit;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}

.form-input:focus {
  border-color: #4f46e5;
  background: rgba(255, 255, 255, 0.15);
}

.form-input::placeholder {
  color: #94a3b8;
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
  color: #fca5a5;
  font-size: 0.875rem;
}

.error-icon {
  font-size: 1rem;
}

.chat-list {
  margin-top: 1rem;
}

.chat-list-title {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #c084fc;
}

.chat-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.chat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.chat-item:hover {
  background: rgba(79, 70, 229, 0.2);
  border-color: #4f46e5;
  transform: translateX(4px);
}

.chat-info {
  flex: 1;
}

.chat-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: #f8fafc;
  margin-bottom: 0.25rem;
}

.chat-date {
  font-size: 0.75rem;
  color: #94a3b8;
}

.chat-arrow {
  color: #4f46e5;
  font-size: 1.2rem;
  font-weight: bold;
  transition: transform 0.2s;
}

.chat-item:hover .chat-arrow {
  transform: translateX(4px);
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  border: none;
  border-radius: 0.75rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
  font-size: 0.95rem;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.login-button.loading {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  animation: pulse 2s infinite;
}

.new-session-button {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.new-session-button:hover {
  border-color: #4f46e5;
  color: #c084fc;
  background: rgba(79, 70, 229, 0.1);
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1.5rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
}

/* Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* Custom scrollbar for chat list */
.chat-items::-webkit-scrollbar {
  width: 4px;
}

.chat-items::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.chat-items::-webkit-scrollbar-thumb {
  background: #4f46e5;
  border-radius: 2px;
}

.chat-items::-webkit-scrollbar-thumb:hover {
  background: #6366f1;
}

/* Email sent message */
.email-sent-message {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  border: 1px solid #22c55e;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
  text-align: center;
}

.success-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.success-title {
  color: #15803d;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
}

.success-text {
  color: #166534;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
}

.email-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.875rem;
  color: #15803d;
}

.note-icon {
  font-size: 1rem;
}

.reset-button, .close-button-action {
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.reset-button:hover, .close-button-action:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* Responsive */
@media (max-width: 640px) {
  .luna-login-card {
    padding: 1.5rem;
    margin: 0.5rem;
  }
  
  .login-title {
    font-size: 1.25rem;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .form-actions button {
    width: 100%;
  }
}
</style>
