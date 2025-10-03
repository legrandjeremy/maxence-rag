import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { createResponse, chatService } from '../../lib/common';
import { EmailService } from '../../lib/EmailService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-04-10' });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const emailService = new EmailService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('🔔 Stripe Webhook: Received event', {
    httpMethod: event.httpMethod,
    path: event.path,
    headers: event.headers,
    bodyLength: event.body?.length || 0
  });

  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  if (!sig || !endpointSecret) {
    console.error('🚨 Stripe Webhook: Missing signature or secret', { sig: !!sig, secret: !!endpointSecret });
    return createResponse(400, { error: 'Bad Request', message: 'Missing webhook signature' });
  }

  try {
    // API Gateway HTTP API default passes body as string; ensure we don't double-parse
    const rawBody = event.body || '';
    console.log('🔔 Stripe Webhook: Processing raw body length:', rawBody.length);
    
    const stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    console.log('🔔 Stripe Webhook: Event type:', stripeEvent.type, 'ID:', stripeEvent.id);

    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      const chatId = (session.metadata?.chatId as string) || '';
      const email = (session.metadata?.email as string) || session.customer_email || '';
      
      console.log(`Stripe webhook: Checkout session completed for chatId: ${chatId}, email: ${email}`);
      
      if (chatId && email) {
        try {
          // Mark chat as paid using ChatService
          await chatService.markChatAsPaid(email.toLowerCase().trim(), chatId);
          console.log(`Successfully processed checkout payment for chat ${chatId}`);
          
          // 🌙 Send payment confirmation email to customer
          try {
            await emailService.sendPaymentConfirmationEmail({
              userEmail: email.toLowerCase().trim(),
              customerName: session.customer_details?.name || undefined,
              chatTitle: session.metadata?.chatTitle || undefined
            });
            console.log(`✨ Payment confirmation email sent to ${email}`);
          } catch (emailError) {
            console.error(`⚠️ Failed to send payment confirmation email to ${email}:`, emailError);
            // Don't fail the webhook even if email fails
          }
        } catch (error) {
          console.error(`Error marking chat as paid (checkout):`, error);
          // Don't fail the webhook - Stripe needs a 200 response
          // But log the error for debugging
        }
      } else {
        console.error('Missing chatId or email in Stripe checkout session metadata:', { chatId, email });
      }
    }

    if (stripeEvent.type === 'payment_intent.succeeded') {
      const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
      const chatId = (paymentIntent.metadata?.chatId as string) || '';
      const email = (paymentIntent.metadata?.email as string) || paymentIntent.receipt_email || '';
      
      console.log(`Stripe webhook: Payment intent succeeded for chatId: ${chatId}, email: ${email}`);
      console.log(`Stripe webhook: Payment intent metadata:`, paymentIntent.metadata);
      
      if (chatId && email) {
        try {
          // Mark chat as paid using ChatService
          await chatService.markChatAsPaid(email.toLowerCase().trim(), chatId);
          console.log(`Successfully processed payment intent for chat ${chatId}`);
          
          // 🌙 Send payment confirmation email to customer
          try {
            await emailService.sendPaymentConfirmationEmail({
              userEmail: email.toLowerCase().trim(),
              customerName: paymentIntent.metadata?.customerName || undefined,
              chatTitle: paymentIntent.metadata?.chatTitle || undefined
            });
            console.log(`✨ Payment confirmation email sent to ${email}`);
          } catch (emailError) {
            console.error(`⚠️ Failed to send payment confirmation email to ${email}:`, emailError);
            // Don't fail the webhook even if email fails
          }
        } catch (error) {
          console.error(`Error marking chat as paid (payment intent):`, error);
          // Don't fail the webhook - Stripe needs a 200 response
          // But log the error for debugging
        }
      } else {
        console.error('Missing chatId or email in Stripe payment intent metadata:', { chatId, email });
      }
    }

    return createResponse(200, { received: true });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    return createResponse(400, { error: 'Bad Request', message: 'Webhook Error' });
  }
};


