import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import Stripe from 'stripe';

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

export const stripeWebhook = onRequest(
  { secrets: [stripeSecretKey, stripeWebhookSecret] },
  async (req, res) => {
    const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: '2024-06-20' });
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        stripeWebhookSecret.value()
      );
    } catch {
      res.status(400).send('Webhook signature invalid');
      return;
    }

    if (event.type !== 'payment_intent.succeeded') {
      res.json({ received: true });
      return;
    }

    const intent = event.data.object as Stripe.PaymentIntent;
    const { userId, notes } = intent.metadata;
    let items: unknown[];
    try {
      items = JSON.parse(intent.metadata.items ?? '[]');
    } catch {
      logger.error('stripeWebhook: failed to parse items metadata', { paymentIntentId: intent.id });
      items = [];
    }
    const subtotal = intent.amount / 100;

    const userSnap = await admin.firestore().doc(`users/${userId}`).get();
    const userName = userSnap.data()?.name ?? 'Cliente';

    try {
      await admin.firestore()
        .collection('orders')
        .doc(intent.id)
        .set({
          userId,
          userName,
          items,
          subtotal,
          status: 'paid',
          paymentIntentId: intent.id,
          paymentStatus: 'paid',
          paymentMethod: 'stripe',
          notes: notes ?? null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (err) {
      logger.error('stripeWebhook: failed to write order to Firestore', { paymentIntentId: intent.id, err });
      res.status(500).json({ error: 'Internal error' });
      return;
    }

    res.json({ received: true });
  }
);
