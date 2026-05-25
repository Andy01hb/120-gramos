import * as functions from 'firebase-functions';
import Stripe from 'stripe';

const stripe = new Stripe(functions.config().stripe.secret_key as string, { apiVersion: '2024-06-20' });

export const createPaymentIntent = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Debes iniciar sesión');

  const { items, notes } = data as {
    items: Array<{ productId: string; name: string; unitPrice: number; quantity: number; flavors: string[]; addBoba: boolean }>;
    notes?: string;
  };
  if (!items?.length) throw new functions.https.HttpsError('invalid-argument', 'El carrito está vacío');

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  if (subtotal < 10) throw new functions.https.HttpsError('invalid-argument', 'Monto mínimo $10 MXN');

  const paymentIntent = await stripe.paymentIntents.create({
    amount: subtotal * 100,
    currency: 'mxn',
    metadata: {
      userId: context.auth.uid,
      notes: notes ?? '',
      items: JSON.stringify(items),
    },
  });

  return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
});
