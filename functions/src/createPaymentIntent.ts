import * as functions from 'firebase-functions';
import Stripe from 'stripe';

const secretKey = functions.config().stripe?.secret_key as string | undefined;
if (!secretKey) throw new Error('Missing Firebase config: stripe.secret_key');
const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });

export const createPaymentIntent = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Debes iniciar sesión');

  const { items, notes } = data as {
    items: Array<{ productId: string; name: string; unitPrice: number; quantity: number; flavors: string[]; addBoba: boolean }>;
    notes?: string;
  };
  if (!items?.length) throw new functions.https.HttpsError('invalid-argument', 'El carrito está vacío');

  for (const item of items) {
    if (typeof item.unitPrice !== 'number' || item.unitPrice <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Precio de producto inválido');
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Cantidad de producto inválida');
    }
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  if (subtotal < 10) throw new functions.https.HttpsError('invalid-argument', 'Monto mínimo $10 MXN');

  const itemsJson = JSON.stringify(items);
  // Stripe metadata values are capped at 500 characters
  const metadataItems = itemsJson.length <= 490
    ? itemsJson
    : JSON.stringify(items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, addBoba: i.addBoba })));

  const paymentIntent = await stripe.paymentIntents.create({
    amount: subtotal * 100,
    currency: 'mxn',
    metadata: {
      userId: context.auth.uid,
      notes: notes ?? '',
      items: metadataItems,
    },
  });

  return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
});
