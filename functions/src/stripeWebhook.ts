import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(functions.config().stripe.secret_key as string, { apiVersion: '2024-06-20' });

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      functions.config().stripe.webhook_secret as string
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
  const items = JSON.parse(intent.metadata.items ?? '[]');
  const subtotal = intent.amount / 100;

  const userSnap = await admin.firestore().doc(`users/${userId}`).get();
  const userName = userSnap.data()?.name ?? 'Cliente';

  await admin.firestore().collection('orders').add({
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

  res.json({ received: true });
});
