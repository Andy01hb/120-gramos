import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { validateOrderItems, OrderItem } from './validateOrderItems';
import { clipAuthToken, clipWebhookUrl, clipCreatePayment } from './clipApi';

interface CounterOrderInput {
  items: OrderItem[];
  notes?: string;
  paymentMethod: 'clip' | 'cash';
  serialNumberPos?: string;
  customerName?: string;
}

/**
 * Counter (POS) order created by staff in the admin app.
 *  - 'cash': marked paid immediately and sent to the kitchen queue.
 *  - 'clip': a charge is started on the physical Clip terminal; the order stays
 *    pending until clipWebhook confirms the card was approved.
 * Orders are written here with the Admin SDK (Firestore rules forbid client creates),
 * mirroring the Stripe webhook path.
 */
export const createCounterOrder = onCall({ secrets: [clipAuthToken] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión');

  const db = admin.firestore();

  // Admin-only: only staff can charge at the counter
  const adminSnap = await db.doc(`users/${request.auth.uid}`).get();
  if (adminSnap.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo el personal puede cobrar en caja');
  }

  const { items, notes, paymentMethod, serialNumberPos, customerName } = request.data as CounterOrderInput;

  if (paymentMethod !== 'clip' && paymentMethod !== 'cash') {
    throw new HttpsError('invalid-argument', 'Método de pago inválido');
  }
  if (notes && notes.length > 200) throw new HttpsError('invalid-argument', 'Las notas son demasiado largas');

  const subtotal = await validateOrderItems(items);

  const orderRef = db.collection('orders').doc();
  const orderId = orderRef.id;
  const baseOrder = {
    userId: request.auth.uid,
    userName: customerName?.trim() || 'Cliente en caja',
    items,
    subtotal,
    notes: notes ?? null,
    paymentMethod,
    paymentIntentId: orderId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // ── Cash: paid immediately ──────────────────────────────────────────────────
  if (paymentMethod === 'cash') {
    await orderRef.set({ ...baseOrder, status: 'paid', paymentStatus: 'paid' });
    return { orderId, paymentMethod };
  }

  // ── Clip card terminal ──────────────────────────────────────────────────────
  if (!serialNumberPos) {
    throw new HttpsError('invalid-argument', 'Falta el número de serie de la terminal Clip');
  }

  // Create the order as pending first so the UI can watch it via onSnapshot
  await orderRef.set({
    ...baseOrder,
    status: 'pending_payment',
    paymentStatus: 'pending',
    clipReference: orderId,
  });

  try {
    const clipRes = await clipCreatePayment({
      amount: Number(subtotal.toFixed(2)), // Clip expects pesos, not cents
      reference: orderId,
      serialNumberPos,
      webhookUrl: clipWebhookUrl.value() || undefined,
    });

    await orderRef.update({
      clipRequestId: clipRes.pinpad_request_id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { orderId, paymentMethod, clipRequestId: clipRes.pinpad_request_id };
  } catch (err: any) {
    logger.error('createCounterOrder: Clip charge failed', { orderId, err: err?.message });
    await orderRef.update({
      status: 'cancelled',
      paymentStatus: 'failed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    throw new HttpsError(
      'unavailable',
      'No se pudo iniciar el cobro en la terminal Clip. Verifica que esté encendida y conectada a internet.'
    );
  }
});
