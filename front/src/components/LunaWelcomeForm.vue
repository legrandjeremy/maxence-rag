<template>
  <div class="luna-welcome-overlay">
    <div class="welcome-container">
      <div class="luna-header">
        <div class="luna-avatar-large">
          <div class="mystical-aura"></div>
          <img 
            src="~assets/Luna.png" 
            alt="Luna - Voyante Mystique" 
            class="luna-face-large"
          />
        </div>
        <h1 class="welcome-title">Bienvenue chez Luna</h1>
        <p class="welcome-subtitle">Oracle des Lignes Cachées</p>
      </div>

      <div class="welcome-content">
        <div class="mystical-introduction">
          <p class="intro-text">
            🌙 Pour vous offrir une guidance mystique personnalisée et précise, 
            Luna a besoin de quelques informations essentielles sur votre être.
          </p>
          <p class="intro-subtext">
            Ces détails permettront à Luna de mieux cerner votre énergie 
            et de vous révéler des vérités cachées sur votre chemin de vie.
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="welcome-form">
          <div class="form-row">
            <div class="form-field">
              <label for="firstName" class="field-label">
                <span class="label-icon">✨</span>
                Prénom
              </label>
              <input
                id="firstName"
                v-model="formData.firstName"
                type="text"
                required
                class="field-input"
                placeholder="Votre prénom"
                @input="clearError"
              />
            </div>

            <div class="form-field">
              <label for="lastName" class="field-label">
                <span class="label-icon">🌟</span>
                Nom
              </label>
              <input
                id="lastName"
                v-model="formData.lastName"
                type="text"
                required
                class="field-input"
                placeholder="Votre nom"
                @input="clearError"
              />
            </div>
          </div>

          <div class="form-field">
            <label for="email" class="field-label">
              <span class="label-icon">💫</span>
              Adresse e-mail
            </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              class="field-input"
              placeholder="votre@email.com"
              @input="clearError"
            />
          </div>

          <div class="form-field">
            <label for="birthDate" class="field-label">
              <span class="label-icon">🌙</span>
              Date de naissance
            </label>
            <input
              id="birthDate"
              v-model="formData.birthDate"
              type="date"
              required
              class="field-input"
              @input="clearError"
            />
            <div class="field-hint">
              Luna utilise votre date de naissance pour des révélations astrologiques précises
            </div>
          </div>

          <div class="form-field">
            <label for="gender" class="field-label">
              <span class="label-icon">⚡</span>
              Genre
            </label>
            <select
              id="gender"
              v-model="formData.gender"
              required
              class="field-input field-select"
              @change="clearError"
            >
              <option value="">Sélectionnez votre genre</option>
              <option value="femme">Femme</option>
              <option value="homme">Homme</option>
            </select>
            <div class="field-hint">
              Luna adapte ses révélations selon votre énergie féminine ou masculine
            </div>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="submit-btn"
            :class="{ submitting: isSubmitting }"
          >
            <span v-if="!isSubmitting" class="btn-content">
              <span class="btn-icon">🔮</span>
              Commencer ma consultation avec Luna
            </span>
            <span v-else class="submitting-content">
              <span class="spinner"></span>
              Préparation de votre séance...
            </span>
          </button>
        </form>

        <div class="login-option">
          <div class="divider">
            <span class="divider-text">ou</span>
          </div>
          <button 
            type="button" 
            @click="showLoginForm"
            class="login-btn"
          >
            <span class="btn-icon">🌙</span>
            Retrouvez votre session avec Luna
          </button>
        </div>

        <div class="mystical-footer">
          <div class="privacy-note">
            <span class="privacy-icon">🔒</span>
            Vos informations personnelles sont protégées et utilisées uniquement pour personnaliser votre expérience mystique avec Luna
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  gender: string;
}

const emit = defineEmits<{
  'customer-info-collected': [info: CustomerInfo];
  'show-login': [];
}>();

const formData = reactive<CustomerInfo>({
  firstName: '',
  lastName: '',
  email: '',
  birthDate: '',
  gender: ''
});

const error = ref<string>('');
const isSubmitting = ref(false);

const clearError = () => {
  error.value = '';
};

const showLoginForm = () => {
  emit('show-login');
};

const validateForm = (): boolean => {
  if (!formData.firstName.trim()) {
    error.value = 'Veuillez entrer votre prénom';
    return false;
  }
  if (!formData.lastName.trim()) {
    error.value = 'Veuillez entrer votre nom';
    return false;
  }
  if (!formData.email.trim()) {
    error.value = 'Veuillez entrer votre adresse e-mail';
    return false;
  }
  if (!formData.email.includes('@')) {
    error.value = 'Veuillez entrer une adresse e-mail valide';
    return false;
  }
  if (!formData.birthDate) {
    error.value = 'Veuillez entrer votre date de naissance';
    return false;
  }
  if (!formData.gender) {
    error.value = 'Veuillez sélectionner votre genre';
    return false;
  }

  // Check if birth date is not in the future
  const today = new Date();
  const birthDate = new Date(formData.birthDate);
  if (birthDate > today) {
    error.value = 'La date de naissance ne peut pas être dans le futur';
    return false;
  }

  // Check if person is at least 13 years old
  const age = today.getFullYear() - birthDate.getFullYear();
  if (age < 13) {
    error.value = 'Vous devez avoir au moins 13 ans pour consulter Luna';
    return false;
  }

  return true;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;
  
  try {
    // Simulate a brief loading period for mystical effect
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Store customer information in localStorage
    localStorage.setItem('guestChat_userEmail', formData.email);
    localStorage.setItem('luna_customer_info', JSON.stringify(formData));
    
    console.log('🌙 Luna: Customer information collected:', formData);
    
    emit('customer-info-collected', { ...formData });
  } catch (err) {
    error.value = 'Une erreur est survenue. Veuillez réessayer.';
    console.error('🚨 Luna: Failed to collect customer info:', err);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.luna-welcome-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
  overflow-y: auto;
}

.welcome-container {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(192, 132, 252, 0.3);
  border-radius: 20px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  backdrop-filter: blur(10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.luna-header {
  text-align: center;
  margin-bottom: 2rem;
}

.luna-avatar-large {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
}

.mystical-aura {
  position: absolute;
  inset: -8px;
  background: conic-gradient(from 0deg, #4f46e5, #06b6d4, #10b981, #f59e0b, #ef4444, #4f46e5);
  border-radius: 50%;
  animation: rotate 3s linear infinite;
  opacity: 0.8;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.luna-face-large {
  position: absolute;
  inset: 8px;
  width: calc(100% - 16px);
  height: calc(100% - 16px);
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.2);
}

.welcome-title {
  color: #f8fafc;
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #c084fc, #06b6d4);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-subtitle {
  color: #c084fc;
  font-size: 1rem;
  margin: 0;
  font-style: italic;
}

.mystical-introduction {
  margin-bottom: 2rem;
  text-align: center;
}

.intro-text {
  color: #e8e8e8;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.intro-subtext {
  color: #a8a8a8;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

.welcome-form {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-field {
  margin-bottom: 1rem;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #c084fc;
  margin-bottom: 0.5rem;
}

.label-icon {
  font-size: 1rem;
}

.field-input {
  width: 100%;
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(192, 132, 252, 0.3);
  border-radius: 10px;
  color: #f8fafc;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.field-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.field-input:focus {
  outline: none;
  border-color: #c084fc;
  box-shadow: 0 0 0 3px rgba(192, 132, 252, 0.2);
  background: rgba(255, 255, 255, 0.15);
}

.field-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23c084fc' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
  cursor: pointer;
}

.field-select option {
  background: #1e1b4b;
  color: #f8fafc;
  padding: 0.5rem;
}

.field-hint {
  font-size: 0.75rem;
  color: #a8a8a8;
  margin-top: 0.25rem;
  font-style: italic;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  text-align: center;
}

.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  color: white;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #6d28d9, #a855f7);
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(124, 58, 237, 0.4);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-icon {
  font-size: 1.1rem;
}

.submitting-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.mystical-footer {
  text-align: center;
}

.privacy-note {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: #a8a8a8;
  font-size: 0.75rem;
  line-height: 1.4;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.privacy-icon {
  font-size: 0.875rem;
  flex-shrink: 0;
  margin-top: 1px;
}

/* Mobile responsive */
@media (max-width: 640px) {
  .welcome-container {
    padding: 1.5rem;
    margin: 0.5rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .welcome-title {
    font-size: 1.5rem;
  }
  
  .luna-avatar-large {
    width: 60px;
    height: 60px;
  }
  
  .login-option {
    margin-top: 1rem;
  }
  
  .login-btn {
    width: 100%;
    padding: 0.75rem;
    font-size: 0.875rem;
  }
}

/* Login option styles */
.login-option {
  margin: 2rem 0 1.5rem 0;
  text-align: center;
}

.divider {
  position: relative;
  margin: 1.5rem 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent);
}

.divider-text {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  padding: 0 1rem;
  color: rgba(139, 92, 246, 0.7);
  font-size: 0.875rem;
  font-weight: 500;
}

.login-btn {
  width: 100%;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.1));
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  color: rgba(139, 92, 246, 0.9);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.login-btn:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(168, 85, 247, 0.15));
  border-color: rgba(139, 92, 246, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.2);
}

.login-btn .btn-icon {
  font-size: 1.1rem;
}
</style>
