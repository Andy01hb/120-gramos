import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  selections: Array<{ optionId: string; question: string; answer: string; extraPrice: number }>;
}

export const createPaymentIntent = onCall({ secrets: [stripeSecretKey], invoker: 'public' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión');

  const { items, notes } = request.data as { items: OrderItem[]; notes?: string };

  if (!items?.length) throw new HttpsError('invalid-argument', 'El carrito está vacío');
  if (notes && notes.length > 200) throw new HttpsError('invalid-argument', 'Las notas son demasiado largas');

  const db = admin.firestore();
  let subtotal = 0;

  // Validate every item against Firestore prices — never trust client-supplied prices
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 20) {
      throw new HttpsError('invalid-argument', 'Cantidad de producto inválida');
    }

    const productSnap = await db.doc(`menu/${item.productId}`).get();
    if (!productSnap.exists) {
      throw new HttpsError('not-found', `Producto no encontrado: ${item.productId}`);
    }
    const product = productSnap.data()!;
    if (!product.available) {
      throw new HttpsError('failed-precondition', `"${product.name}" ya no está disponible`);
    }

    // Compute expected unit price from server data
    let expectedUnitPrice: number = product.price;
    for (const sel of (item.selections ?? [])) {
      const opt = (product.options ?? []).find((o: any) => o.id === sel.optionId);
      if (opt) expectedUnitPrice += (opt.extraPrice ?? 0);
    }

    // Compare with cents precision to avoid float issues
    if (Math.round(item.unitPrice * 100) !== Math.round(expectedUnitPrice * 100)) {
      throw new HttpsError('invalid-argument', `El precio de "${product.name}" no es válido`);
    }

    subtotal += expectedUnitPrice * item.quantity;
  }

  if (subtotal < 10) throw new HttpsError('invalid-argument', 'Monto mínimo $10 MXN');

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
