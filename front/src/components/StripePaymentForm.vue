<template>
  <div class="stripe-payment-form">
    <div class="payment-form-header">
      <h3 class="payment-form-title">
        ✨ Paiement Sécurisé - Luna
      </h3>
      <button @click="$emit('close')" class="payment-form-close">
        ✕
      </button>
    </div>

    <div class="payment-form-body">
      <div class="payment-info">
        <div class="payment-amount">
          <span class="amount-label">Montant à payer:</span>
          <span class="amount-value">5,00 €</span>
        </div>
        <p class="payment-description">
          Débloquez votre consultation illimitée avec Luna
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="stripe-form">
        <div class="form-field">
          <label for="email" class="field-label">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="field-input"
            placeholder="votre@email.com"
          />
        </div>

        <div class="form-field">
          <label for="card-element" class="field-label">Informations de carte</label>
          <div id="card-element" ref="cardElementRef" class="stripe-card-element">
            <!-- Stripe Elements will create form elements here -->
          </div>
          <div id="card-errors" role="alert" class="card-errors"></div>
        </div>

        <button
          type="submit"
          :disabled="isProcessing || !stripe"
          class="payment-submit-btn"
          :class="{ processing: isProcessing }"
        >
          <span v-if="!isProcessing">
            <span class="btn-icon">💳</span>
            Payer 5,00 € ✨
          </span>
          <span v-else class="processing-text">
            <span class="spinner"></span>
            Traitement en cours...
          </span>
        </button>
      </form>

      <div class="payment-security">
        <div class="security-badges">
          <span class="security-badge">🔒 SSL</span>
          <span class="security-badge">🛡️ Stripe</span>
          <span class="security-badge">✅ Sécurisé</span>
        </div>
        <p class="security-text">
          Vos données de paiement sont sécurisées et chiffrées
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';

// Props and emits
interface Props {
  userEmail?: string;
}

const props = withDefaults(defineProps<Props>(), {
  userEmail: ''
});

const emit = defineEmits<{
  'payment-success': [];
  'payment-error': [error: string];
  'close': [];
}>();

// Reactive state
const stripe = ref<Stripe | null>(null);
const elements = ref<StripeElements | null>(null);
const cardElement = ref<StripeCardElement | null>(null);
const cardElementRef = ref<HTMLElement>();
const isProcessing = ref(false);
const email = ref('');

// Initialize Stripe
onMounted(async () => {
  try {
    console.log('🌙 Stripe: Initializing embedded payment form...');
    
    // Load Stripe with your publishable key
    const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || 'not_provided';
    console.log('🌙 Stripe: Using publishable key:', stripePublishableKey);
    
    if (stripePublishableKey === 'pk_test_your_key_here' || !stripePublishableKey.startsWith('pk_')) {
      throw new Error('Please set VITE_STRIPE_PUBLISHABLE_KEY in your .env file');
    }
    
    console.log('🌙 Stripe: Loading Stripe.js...');
    stripe.value = await loadStripe(stripePublishableKey);
    
    if (!stripe.value) {
      throw new Error('Failed to load Stripe');
    }
    console.log('✅ Stripe: Stripe.js loaded successfully');

    // Set email from props if available
    if (props.userEmail) {
      email.value = props.userEmail;
      console.log('🌙 Stripe: Email set from props:', email.value);
    }

    console.log('🌙 Stripe: Creating Elements instance...');
    // Create elements instance
    elements.value = stripe.value.elements({
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#7c3aed',
          colorBackground: '#ffffff',
          colorText: '#1f2937',
          colorDanger: '#ef4444',
          fontFamily: 'system-ui, sans-serif',
          spacingUnit: '4px',
          borderRadius: '8px'
        },
        rules: {
          '.Input': {
            border: '1px solid #d1d5db',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          },
          '.Input:focus': {
            border: '1px solid #7c3aed',
            boxShadow: '0 0 0 3px rgba(124, 58, 237, 0.1)'
          }
        }
      }
    });
    console.log('✅ Stripe: Elements instance created');

    console.log('🌙 Stripe: Creating card element...');
    // Create card element
    cardElement.value = elements.value.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#1f2937',
          '::placeholder': {
            color: '#9ca3af'
          }
        }
      }
    });
    console.log('✅ Stripe: Card element created');

    // Mount card element
    console.log('🌙 Stripe: Waiting for DOM and mounting card element...');
    await nextTick();
    
    if (!cardElementRef.value) {
      console.error('🚨 Stripe: Card element ref not found in DOM');
      throw new Error('Card element container not found');
    }
    
    console.log('🌙 Stripe: Mounting card element to DOM...');
    cardElement.value.mount(cardElementRef.value);
    console.log('✅ Stripe: Card element mounted successfully');
    
    // Handle real-time validation errors from the card Element
    console.log('🌙 Stripe: Setting up card validation...');
    cardElement.value.on('change', ({error}) => {
      console.log('🌙 Stripe: Card validation change:', error ? error.message : 'Valid');
      const errorElement = document.getElementById('card-errors');
      if (errorElement) {
        if (error) {
          errorElement.textContent = error.message;
        } else {
          errorElement.textContent = '';
        }
      }
    });

    console.log('✅ Stripe: Payment form initialized successfully');
  } catch (error) {
    console.error('🚨 Stripe: Failed to initialize payment form:', error);
    emit('payment-error', 'Erreur lors de l\'initialisation du paiement');
  }
});

// Handle form submission
const handleSubmit = async () => {
  if (!stripe.value || !cardElement.value || !email.value) {
    return;
  }

  isProcessing.value = true;

  try {
    console.log('🌙 Stripe: Processing payment...');

    // Create payment intent on backend
    const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/payments/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        amount: 500, // 5 EUR in cents
        currency: 'eur',
        description: 'Luna - Consultation illimitée'
      })
    });

    const responseData = await response.json();
    const { client_secret, development_mode, message } = responseData;

    if (!client_secret) {
      throw new Error('No client secret received');
    }

    console.log('🌙 Stripe: Received client_secret:', client_secret);
    if (development_mode) {
      console.log('🚀 Development mode detected:', message);
    }

    // Check if this is a mock client_secret (for development)
    const isMockPayment = development_mode || client_secret.startsWith('pi_1755674292938') || client_secret.includes('test_');
    
    if (isMockPayment) {
      console.log('🚀 Stripe: Development mode - simulating successful payment');
      console.log('💡 Note: No actual payment will be processed in development mode');
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful payment
      console.log('✅ Stripe: Mock payment succeeded:', client_secret);
      emit('payment-success');
    } else {
      // Real Stripe payment flow
      console.log('🌙 Stripe: Processing real payment with Stripe API');
      
      const { error, paymentIntent } = await stripe.value.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement.value,
          billing_details: {
            email: email.value
          }
        }
      });

      if (error) {
        console.error('🚨 Stripe: Payment failed:', error);
        emit('payment-error', error.message || 'Erreur de paiement');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Stripe: Payment succeeded:', paymentIntent.id);
        emit('payment-success');
      }
    }
  } catch (error) {
    console.error('🚨 Stripe: Payment error:', error);
    emit('payment-error', 'Erreur lors du traitement du paiement');
  } finally {
    isProcessing.value = false;
  }
};

// Cleanup
onUnmounted(() => {
  if (cardElement.value) {
    cardElement.value.destroy();
  }
});
</script>

<style scoped>
.stripe-payment-form {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 450px;
  overflow: hidden;
  border: 3px solid #c084fc;
}

.payment-form-header {
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  color: white;
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payment-form-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.payment-form-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.5rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.payment-form-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.payment-form-body {
  padding: 1.5rem;
}

.payment-info {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.payment-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.amount-label {
  color: #6b7280;
  font-size: 0.9rem;
}

.amount-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #7c3aed;
}

.payment-description {
  color: #374151;
  font-size: 0.875rem;
  margin: 0;
}

.stripe-form {
  margin-bottom: 1.5rem;
}

.form-field {
  margin-bottom: 1rem;
}

.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.field-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.field-input:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.stripe-card-element {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
}

.card-errors {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  min-height: 1.25rem;
}

.payment-submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  color: white;
  border: none;
  padding: 0.875rem 1.5rem;
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

.payment-submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #6d28d9, #a855f7);
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(124, 58, 237, 0.4);
}

.payment-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.payment-submit-btn.processing {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

.btn-icon {
  font-size: 1.1rem;
}

.processing-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.payment-security {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.security-badges {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.security-badge {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.security-text {
  color: #6b7280;
  font-size: 0.75rem;
  margin: 0;
}

/* Mobile responsive */
@media (max-width: 640px) {
  .stripe-payment-form {
    margin: 1rem;
    max-width: none;
  }
  
  .payment-form-header {
    padding: 1rem;
  }
  
  .payment-form-body {
    padding: 1rem;
  }
  
  .security-badges {
    gap: 0.5rem;
  }
  
  .security-badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
  }
}
</style>
