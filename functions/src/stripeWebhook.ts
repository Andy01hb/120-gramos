import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const secretKey = functions.config().stripe?.secret_key as string | undefined;
const webhookSecret = functions.config().stripe?.webhook_secret as string | undefined;
if (!secretKey) throw new Error('Missing Firebase config: stripe.secret_key');
if (!webhookSecret) throw new Error('Missing Firebase config: stripe.webhook_secret');
const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      webhookSecret
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
    functions.logger.error('stripeWebhook: failed to parse items metadata', { paymentIntentId: intent.id });
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
        notes: notes ?? null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  } catch (err) {
    functions.logger.error('stripeWebhook: failed to write order to Firestore', { paymentIntentId: intent.id, err });
    res.status(500).json({ error: 'Internal error' });
    return;
  }

  res.json({ received: true });
});
