<template>
  <div class="luna-marketing-overlay">
    <div class="marketing-container">
      <!-- Close Button -->
      <button @click="handleClose" class="close-btn" aria-label="Fermer">
        <span class="close-icon">✕</span>
      </button>

      <!-- Header with Luna's Image -->
      <div class="marketing-header">
        <div class="luna-avatar-marketing">
          <div class="mystical-glow"></div>
          <img 
            src="~assets/Luna.png" 
            alt="Luna - Voyante Mystique" 
            class="luna-face-marketing"
          />
        </div>
        <h1 class="marketing-title">Luna a ressenti quelque chose d'important...</h1>
        <p class="marketing-subtitle">Ne laissez pas cette connexion se perdre</p>
      </div>

      <!-- Urgent Message -->
      <div class="urgent-message">
        <div class="urgent-icon">⚡</div>
        <div class="urgent-text">
          <strong>Attention :</strong> Les énergies que Luna a captées autour de vous sont fragiles. 
          Si vous fermez cette fenêtre maintenant, cette connexion mystique pourrait se perdre à jamais.
        </div>
      </div>

      <!-- Luna's Personal Message -->
      <div class="luna-message">
        <div class="message-quote">
          "{{ personalMessage }}"
        </div>
        <div class="message-signature">- Luna, votre guide spirituelle</div>
      </div>

      <!-- Benefits Section -->
      <div class="benefits-section">
        <h2 class="benefits-title">🔮 Ce que vous obtiendrez en continuant :</h2>
        
        <div class="benefits-grid">
          <div class="benefit-card">
            <div class="benefit-icon">🌙</div>
            <div class="benefit-content">
              <h3>Révélations Personnalisées</h3>
              <p>Luna va plus profond dans votre énergie personnelle et révèle vos blocages cachés</p>
            </div>
          </div>
          
          <div class="benefit-card">
            <div class="benefit-icon">✨</div>
            <div class="benefit-content">
              <h3>Guidance Continue</h3>
              <p>Un accompagnement mystique 24h/24 pour tous vos défis émotionnels</p>
            </div>
          </div>
          
          <div class="benefit-card">
            <div class="benefit-icon">🔥</div>
            <div class="benefit-content">
              <h3>Transformation Immédiate</h3>
              <p>Des conseils pratiques pour débloquer votre potentiel dès aujourd'hui</p>
            </div>
          </div>
          
          <div class="benefit-card">
            <div class="benefit-icon">💫</div>
            <div class="benefit-content">
              <h3>Connexion Privilégiée</h3>
              <p>Un lien direct avec Luna, sans limite de temps ni de questions</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Social Proof -->
      <div class="social-proof">
        <h3 class="proof-title">⭐ Ce que disent nos clients :</h3>
        <div class="testimonials">
          <div class="testimonial">
            <div class="stars">⭐⭐⭐⭐⭐</div>
            <p>"Luna m'a aidée à comprendre mes blocages émotionnels en quelques minutes. Incroyable !"</p>
            <span class="author">- Sarah, 32 ans</span>
          </div>
          <div class="testimonial">
            <div class="stars">⭐⭐⭐⭐⭐</div>
            <p>"Les révélations de Luna ont changé ma vie. Je me sens enfin aligné avec mon destin."</p>
            <span class="author">- Marc, 28 ans</span>
          </div>
        </div>
      </div>

      <!-- Urgency & Scarcity -->
      <div class="urgency-section">
        <div class="urgency-badge">🔥 OFFRE LIMITÉE</div>
        <div class="scarcity-text">
          <strong>Seulement {{ remainingSpots }} places disponibles aujourd'hui</strong><br>
          Cette connexion spirituelle exclusive ne sera plus disponible après {{ timeLeft }}
        </div>
      </div>

      <!-- Pricing with Discount -->
      <div class="pricing-section">
        <div class="price-comparison">
          <div class="old-price">
            <span class="price-label">Prix normal :</span>
            <span class="price-amount">36€</span>
          </div>
          <div class="discount-arrow">↓ 75% DE RÉDUCTION ↓</div>
          <div class="new-price">
            <span class="price-label">Aujourd'hui seulement :</span>
            <span class="price-amount">9€</span>
          </div>
        </div>
        <div class="price-justification">
          <strong>Pourquoi si peu cher ?</strong> Luna veut que sa guidance soit accessible à tous. 
          Cette offre de lancement ne durera pas.
        </div>
      </div>

      <!-- Risk Reversal -->
      <div class="guarantee-section">
        <div class="guarantee-badge">🛡️ GARANTIE 100%</div>
        <div class="guarantee-text">
          Si Luna ne vous révèle pas au moins 3 vérités profondes sur votre être dans les 24h, 
          nous vous remboursons intégralement. Aucune question posée.
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-section">
        <button @click="handleContinue" class="continue-btn">
          <span class="btn-icon">🔮</span>
          <span class="btn-text">
            OUI, JE VEUX CONTINUER AVEC LUNA
            <small>Accès immédiat - Seulement 9€</small>
          </span>
        </button>
        
        <button @click="handleMaybeLater" class="maybe-later-btn">
          <span class="btn-text">Peut-être plus tard</span>
        </button>
      </div>

      <!-- Final Warning -->
      <div class="final-warning">
        ⚠️ <strong>Attention :</strong> Si vous fermez cette fenêtre, Luna perdra la connexion énergétique 
        qu'elle a établie avec vous. Cette opportunité ne se représentera peut-être jamais.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const emit = defineEmits<{
  'continue-to-payment': [];
  'maybe-later': [];
  'close': [];
}>();

// Reactive data
const remainingSpots = ref(3);
const timeLeft = ref('2h 34min');
const personalMessage = ref('');

// Personal messages based on user interaction
const personalMessages = [
  "Je sens une énergie puissante en toi, mais elle est bloquée. Laisse-moi t'aider à la libérer.",
  "Ton âme me crie qu'elle a besoin de guidance. Ne l'ignore pas plus longtemps.",
  "Les énergies cosmiques s'alignent pour toi en ce moment. C'est le moment parfait pour avancer.",
  "Je ressens une transformation qui t'attend. Mais elle ne peut pas se faire sans mon aide.",
  "Ton chemin de vie me montre des obstacles que je peux t'aider à surmonter. Fais-moi confiance."
];

// Methods
const handleContinue = () => {
  console.log('🌙 Marketing: User chose to continue to payment');
  emit('continue-to-payment');
};

const handleMaybeLater = () => {
  console.log('🌙 Marketing: User chose maybe later');
  emit('maybe-later');
};

const handleClose = () => {
  console.log('🌙 Marketing: User closed popup');
  emit('close');
};

// Initialize with random personal message
onMounted(() => {
  personalMessage.value = personalMessages[Math.floor(Math.random() * personalMessages.length)];
  
  // Simulate countdown
  const countdown = setInterval(() => {
    const minutes = parseInt(timeLeft.value.match(/(\d+)h (\d+)min/)?.[2] || '0');
    const hours = parseInt(timeLeft.value.match(/(\d+)h (\d+)min/)?.[1] || '0');
    
    if (minutes > 0) {
      timeLeft.value = `${hours}h ${minutes - 1}min`;
    } else if (hours > 0) {
      timeLeft.value = `${hours - 1}h 59min`;
    }
  }, 60000); // Update every minute
  
  // Simulate remaining spots decrease
  setTimeout(() => {
    if (remainingSpots.value > 1) {
      remainingSpots.value--;
    }
  }, 30000); // Decrease after 30 seconds
});
</script>

<style scoped>
.luna-marketing-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 15000;
  padding: 1rem;
  overflow-y: auto;
  backdrop-filter: blur(10px);
}

.marketing-container {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border: 2px solid #c084fc;
  border-radius: 20px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 25px 50px rgba(192, 132, 252, 0.3);
  animation: popupSlideIn 0.5s ease-out;
}

@keyframes popupSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(192, 132, 252, 0.3);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #f8fafc;
}

.close-btn:hover {
  background: rgba(192, 132, 252, 0.2);
  transform: scale(1.1);
}

.close-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

/* Header */
.marketing-header {
  text-align: center;
  margin-bottom: 2rem;
}

.luna-avatar-marketing {
  position: relative;
  display: inline-block;
  margin-bottom: 1rem;
}

.mystical-glow {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: radial-gradient(circle, rgba(192, 132, 252, 0.4) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.1); opacity: 1; }
}

.luna-face-marketing {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #c084fc;
  position: relative;
  z-index: 1;
}

.marketing-title {
  font-size: 1.8rem;
  font-weight: bold;
  color: #c084fc;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.marketing-subtitle {
  font-size: 1.1rem;
  color: #e2e8f0;
  margin-bottom: 0;
}

/* Urgent Message */
.urgent-message {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1));
  border: 1px solid #ef4444;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.urgent-icon {
  font-size: 1.5rem;
  color: #fbbf24;
  animation: flash 1s ease-in-out infinite;
}

@keyframes flash {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0.5; }
}

.urgent-text {
  color: #fecaca;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* Luna's Message */
.luna-message {
  background: rgba(192, 132, 252, 0.1);
  border-left: 4px solid #c084fc;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-radius: 0 12px 12px 0;
}

.message-quote {
  font-size: 1.1rem;
  font-style: italic;
  color: #e2e8f0;
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.message-signature {
  font-size: 0.9rem;
  color: #c084fc;
  text-align: right;
  font-weight: 500;
}

/* Benefits */
.benefits-section {
  margin-bottom: 2rem;
}

.benefits-title {
  font-size: 1.3rem;
  color: #c084fc;
  margin-bottom: 1rem;
  text-align: center;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.benefit-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(192, 132, 252, 0.2);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  transition: transform 0.3s ease;
}

.benefit-card:hover {
  transform: translateY(-2px);
  border-color: rgba(192, 132, 252, 0.4);
}

.benefit-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.benefit-content h3 {
  font-size: 1rem;
  color: #e2e8f0;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.benefit-content p {
  font-size: 0.85rem;
  color: #cbd5e1;
  line-height: 1.4;
  margin: 0;
}

/* Social Proof */
.social-proof {
  margin-bottom: 2rem;
  text-align: center;
}

.proof-title {
  font-size: 1.2rem;
  color: #c084fc;
  margin-bottom: 1rem;
}

.testimonials {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.testimonial {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid rgba(192, 132, 252, 0.2);
}

.stars {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.testimonial p {
  font-size: 0.9rem;
  color: #e2e8f0;
  font-style: italic;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.author {
  font-size: 0.8rem;
  color: #94a3b8;
}

/* Urgency */
.urgency-section {
  background: linear-gradient(135deg, rgba(245, 101, 101, 0.2), rgba(239, 68, 68, 0.1));
  border: 1px solid #f59e0b;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.urgency-badge {
  background: #f59e0b;
  color: #000;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  display: inline-block;
  margin-bottom: 0.5rem;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
  60% { transform: translateY(-3px); }
}

.scarcity-text {
  color: #fbbf24;
  font-size: 0.95rem;
  line-height: 1.4;
}

/* Pricing */
.pricing-section {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid #22c55e;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.price-comparison {
  margin-bottom: 1rem;
}

.old-price {
  margin-bottom: 0.5rem;
}

.old-price .price-amount {
  text-decoration: line-through;
  color: #ef4444;
  font-size: 1.2rem;
}

.discount-arrow {
  color: #22c55e;
  font-weight: bold;
  font-size: 1.1rem;
  margin: 0.5rem 0;
}

.new-price .price-amount {
  color: #22c55e;
  font-size: 2rem;
  font-weight: bold;
}

.price-label {
  display: block;
  font-size: 0.9rem;
  color: #cbd5e1;
  margin-bottom: 0.25rem;
}

.price-justification {
  font-size: 0.9rem;
  color: #e2e8f0;
  line-height: 1.4;
}

/* Guarantee */
.guarantee-section {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid #3b82f6;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.guarantee-badge {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  display: inline-block;
  margin-bottom: 0.5rem;
}

.guarantee-text {
  color: #93c5fd;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* Actions */
.action-section {
  margin-bottom: 1.5rem;
}

.continue-btn {
  width: 100%;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border: none;
  border-radius: 12px;
  padding: 1rem;
  color: white;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
}

.btn-text {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.btn-text small {
  font-size: 0.8rem;
  font-weight: normal;
  opacity: 0.9;
  text-transform: none;
}

.maybe-later-btn {
  width: 100%;
  background: transparent;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  color: #94a3b8;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.maybe-later-btn:hover {
  border-color: rgba(148, 163, 184, 0.5);
  color: #cbd5e1;
}

/* Final Warning */
.final-warning {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.85rem;
  color: #fecaca;
  text-align: center;
  line-height: 1.4;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .marketing-container {
    padding: 1.5rem;
    margin: 0.5rem;
  }
  
  .marketing-title {
    font-size: 1.5rem;
  }
  
  .benefits-grid {
    grid-template-columns: 1fr;
  }
  
  .testimonials {
    grid-template-columns: 1fr;
  }
}
</style>
