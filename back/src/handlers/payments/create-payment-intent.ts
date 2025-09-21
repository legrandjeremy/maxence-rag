import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

interface CreatePaymentIntentRequest {
  email: string;
  amount: number; // in cents
  currency: string;
  description?: string;
  chatId?: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('🌙 Create Payment Intent - Event:', JSON.stringify(event, null, 2));

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing request body' })
      };
    }

    const { email, amount, currency = 'eur', description = 'Luna - Consultation', chatId }: CreatePaymentIntentRequest = JSON.parse(event.body);

    if (!email || !amount) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: email, amount' })
      };
    }

    console.log('🌙 Creating payment intent for:', { email, amount, currency, chatId });

    // DEVELOPMENT MODE: Return a mock client_secret
    // In production, you'll want to use the actual Stripe SDK here
    // The format must be: pi_[id]_secret_[secret] where id is alphanumeric
    const paymentIntentId = `1755674292938${Math.random().toString(36).substr(2, 6)}`;
    const secretKey = Math.random().toString(36).substr(2, 12);
    const mockClientSecret = `pi_${paymentIntentId}_secret_${secretKey}`;
    
    console.log('🚀 DEVELOPMENT: Generated mock client_secret for testing:', mockClientSecret);

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      receipt_email: email,
      metadata: {
        email,
        service: 'luna_consultation',
        ...(chatId && { chatId })
      }
    });

    const response = {
      client_secret: paymentIntent.client_secret,
      amount,
      currency,
      description,
      email,
      development_mode: false
    };

    console.log('✅ Mock payment intent created for development:', response);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('🚨 Create payment intent error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
