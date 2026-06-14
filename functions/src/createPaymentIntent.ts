import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import Stripe from 'stripe';
import { validateOrderItems, OrderItem } from './validateOrderItems';

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');

export const createPaymentIntent = onCall({ secrets: [stripeSecretKey], invoker: 'public' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión');

  const { items, notes } = request.data as { items: OrderItem[]; notes?: string };

  if (notes && notes.length > 200) throw new HttpsError('invalid-argument', 'Las notas son demasiado largas');

  // Validate items against Firestore prices and get the server-trusted subtotal
  const subtotal = await validateOrderItems(items);

  const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: '2024-06-20' });

  const itemsJson = JSON.stringify(items);
  const metadataItems = itemsJson.length <= 490
    ? itemsJson
    : JSON.stringify(items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })));

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(subtotal * 100),
    currency: 'mxn',
    metadata: {
      userId: request.auth.uid,
      notes: notes ?? '',
      items: metadataItems,
    },
  });

  return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
});
