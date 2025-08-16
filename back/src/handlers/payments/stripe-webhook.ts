import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { createResponse, databaseService } from '../../lib/common';
import { BaseEntity } from '../../lib/DatabaseService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  if (!sig || !endpointSecret) {
    return createResponse(400, { error: 'Bad Request', message: 'Missing webhook signature' });
  }

  try {
    // API Gateway HTTP API default passes body as string; ensure we don't double-parse
    const rawBody = event.body || '';
    const stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);

    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      const chatId = (session.metadata?.chatId as string) || '';
      const email = (session.metadata?.email as string) || session.customer_email || '';
      if (chatId && email) {
        // Mark chat as paid; paywall logic checks isPaid flag first
        interface ChatPaidUpdate extends BaseEntity { isPaid?: boolean }
        await databaseService.update<ChatPaidUpdate>(
          `CHAT#${email}`,
          `CHAT#${chatId}`,
          { isPaid: true }
        );
      }
    }

    return createResponse(200, { received: true });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    return createResponse(400, { error: 'Bad Request', message: 'Webhook Error' });
  }
};


