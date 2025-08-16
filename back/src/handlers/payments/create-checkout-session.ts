import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { createResponse } from '../../lib/common';

interface CreateCheckoutSessionRequest {
  chatId: string;
  email: string;
  successUrl?: string;
  cancelUrl?: string;
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!stripeSecretKey) {
      return createResponse(500, { error: 'Server Misconfiguration', message: 'Stripe is not configured' });
    }

    let request: CreateCheckoutSessionRequest;
    try {
      request = JSON.parse(event.body || '{}');
    } catch {
      return createResponse(400, { error: 'Bad Request', message: 'Invalid JSON in request body' });
    }

    if (!request.chatId || !request.email) {
      return createResponse(400, { error: 'Bad Request', message: 'chatId and email are required' });
    }

    const amountCents = 500; // 5 EUR

    const successUrl = request.successUrl || `${process.env.FRONTEND_URL || 'https://example.com'}/welcome.html?payment=success`;
    const cancelUrl = request.cancelUrl || `${process.env.FRONTEND_URL || 'https://example.com'}/welcome.html?payment=cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: 'Consultation Luna - Accès prolongé' },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      customer_email: request.email,
      metadata: {
        chatId: request.chatId,
        email: request.email,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return createResponse(200, { data: { id: session.id, url: session.url } });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return createResponse(500, { error: 'Internal Server Error', message });
  }
};


