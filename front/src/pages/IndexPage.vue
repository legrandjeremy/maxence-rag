<template>
  <q-page class="flex flex-center luna-index-page">
    <div class="text-center luna-redirect-container">
      <!-- Luna Logo/Avatar -->
      <div class="luna-avatar-container">
        <div class="mystical-aura"></div>
        <img 
          src="~assets/Luna.png" 
          alt="Luna - Voyante Mystique" 
          class="luna-avatar"
        />
      </div>

      <!-- Main Title -->
      <h1 class="luna-title">Luna</h1>
      <p class="luna-subtitle">Voyante Mystique & Guide Spirituelle</p>
      
      <!-- Redirection Message -->
      <div class="redirect-message">
        <div class="redirect-text">
          🌙 Luna vous attend pour une consultation mystique personnalisée
        </div>
        
        <!-- Countdown Timer -->
        <div class="countdown-container">
          <div class="countdown-text">Redirection automatique dans</div>
          <div class="countdown-timer">{{ countdown }}</div>
          <div class="countdown-unit">{{ countdown > 1 ? 'secondes' : 'seconde' }}</div>
        </div>

        <!-- Manual Redirect Button -->
        <q-btn
          @click="redirectToWelcome"
          color="purple"
          size="lg"
          class="redirect-btn"
          :loading="isRedirecting"
        >
          <span class="btn-icon">🔮</span>
          <span class="btn-text">Commencer ma consultation maintenant</span>
        </q-btn>

        <!-- Skip Timer Link -->
        <div class="skip-timer">
          <a @click="redirectToWelcome" class="skip-link">
            Passer le délai d'attente
          </a>
        </div>
      </div>
      
      <!-- Player Management Navigation Test (for authenticated users) -->
      <div v-if="authStore.hasAccessToPlayerManagement" class="admin-section">
        <div class="admin-divider"></div>
        <div class="admin-title">Administration</div>
        <div class="q-gutter-md">
          <q-btn 
            v-if="authStore.hasPlayerManagementAdminAccess"
            color="secondary" 
            label="Chat Admin"
            @click="$router.push('/chat')"
            size="sm"
            outline
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from 'src/stores/authStore'

const authStore = useAuthStore()

// Reactive state
const countdown = ref(5) // 5 seconds countdown
const isRedirecting = ref(false)
let countdownInterval: number | null = null

// Redirect function
const redirectToWelcome = () => {
  if (isRedirecting.value) return
  
  isRedirecting.value = true
  console.log('🌙 Luna: Redirecting to welcome page...')
  
  // Clear any existing interval
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
  
  // Redirect to welcome.html
  window.location.href = '/welcome.html'
}

// Start countdown on mount
onMounted(() => {
  console.log('🌙 Luna: Starting countdown timer for welcome page redirect')
  
  countdownInterval = window.setInterval(() => {
    countdown.value--
    
    if (countdown.value <= 0) {
      redirectToWelcome()
    }
  }, 1000)
})

// Cleanup on unmount
onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
})
</script>

<style scoped>
/* Main Page Styling */
.luna-index-page {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  min-height: 100vh;
  color: #f8fafc;
}

.luna-redirect-container {
  max-width: 600px;
  width: 100%;
  padding: 2rem;
}

/* Luna Avatar */
.luna-avatar-container {
  position: relative;
  display: inline-block;
  margin-bottom: 2rem;
}

.mystical-aura {
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background: radial-gradient(circle, rgba(192, 132, 252, 0.4) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { 
    transform: scale(1); 
    opacity: 0.7; 
  }
  50% { 
    transform: scale(1.1); 
    opacity: 1; 
  }
}

.luna-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid #c084fc;
  position: relative;
  z-index: 1;
  box-shadow: 0 10px 30px rgba(192, 132, 252, 0.3);
}

/* Title Styling */
.luna-title {
  font-size: 3rem;
  font-weight: bold;
  color: #c084fc;
  margin-bottom: 0.5rem;
  text-shadow: 0 4px 8px rgba(192, 132, 252, 0.4);
  background: linear-gradient(135deg, #c084fc, #a855f7, #9333ea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.luna-subtitle {
  font-size: 1.2rem;
  color: #e2e8f0;
  margin-bottom: 2rem;
  opacity: 0.9;
}

/* Redirect Message */
.redirect-message {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(192, 132, 252, 0.3);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.redirect-text {
  font-size: 1.1rem;
  color: #e2e8f0;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

/* Countdown Timer */
.countdown-container {
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(192, 132, 252, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(192, 132, 252, 0.2);
}

.countdown-text {
  font-size: 0.9rem;
  color: #cbd5e1;
  margin-bottom: 0.5rem;
}

.countdown-timer {
  font-size: 3rem;
  font-weight: bold;
  color: #c084fc;
  text-shadow: 0 2px 4px rgba(192, 132, 252, 0.4);
  animation: countdownPulse 1s ease-in-out infinite;
}

@keyframes countdownPulse {
  0%, 100% { 
    transform: scale(1); 
  }
  50% { 
    transform: scale(1.05); 
  }
}

.countdown-unit {
  font-size: 0.9rem;
  color: #94a3b8;
  margin-top: 0.25rem;
}

/* Redirect Button */
.redirect-btn {
  width: 100%;
  padding: 1rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
}

.redirect-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
}

.btn-icon {
  font-size: 1.2rem;
  margin-right: 0.5rem;
}

.btn-text {
  font-weight: 600;
}

/* Skip Timer Link */
.skip-timer {
  margin-top: 1rem;
}

.skip-link {
  color: #94a3b8;
  font-size: 0.9rem;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.3s ease;
}

.skip-link:hover {
  color: #c084fc;
}

/* Admin Section */
.admin-section {
  margin-top: 3rem;
  padding-top: 2rem;
}

.admin-divider {
  width: 50%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(192, 132, 252, 0.3), transparent);
  margin: 0 auto 1rem auto;
}

.admin-title {
  font-size: 0.9rem;
  color: #94a3b8;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .luna-redirect-container {
    padding: 1.5rem;
  }
  
  .luna-title {
    font-size: 2.5rem;
  }
  
  .luna-avatar {
    width: 100px;
    height: 100px;
  }
  
  .redirect-message {
    padding: 1.5rem;
  }
  
  .countdown-timer {
    font-size: 2.5rem;
  }
}

@media (max-width: 480px) {
  .luna-title {
    font-size: 2rem;
  }
  
  .luna-avatar {
    width: 80px;
    height: 80px;
  }
  
  .redirect-message {
    padding: 1rem;
  }
  
  .countdown-timer {
    font-size: 2rem;
  }
}
</style>
