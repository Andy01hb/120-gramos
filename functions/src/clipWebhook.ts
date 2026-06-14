import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { clipAuthToken, clipGetPayment } from './clipApi';

/**
 * Receives Clip PinPad status-changed notifications. The webhook payload is not
 * signed, so we never trust it: on every notification we re-query Clip for the
 * real payment status and only then update the order.
 */
export const clipWebhook = onRequest({ secrets: [clipAuthToken] }, async (req, res) => {
  const { id, event_type } = (req.body ?? {}) as { id?: string; event_type?: string };

  if (event_type !== 'PINPAD_INTENT_STATUS_CHANGED' || !id) {
    res.json({ received: true });
    return;
  }

  let payment;
  try {
    payment = await clipGetPayment(id);
  } catch (err: any) {
    // Ack so Clip stops retrying; the order stays pending and can be reconciled.
    logger.error('clipWebhook: failed to fetch payment detail', { id, err: err?.message });
    res.status(200).json({ received: true });
    return;
  }

  const db = admin.firestore();
  const snap = await db.collection('orders').where('clipRequestId', '==', id).limit(1).get();
  if (snap.empty) {
    logger.warn('clipWebhook: no order found for clipRequestId', { id });
    res.json({ received: true });
    return;
  }
  const orderRef = snap.docs[0].ref;

  const approvedTxn = payment.detail?.results?.find(r => r.status === 'approved');
  const isPaid = payment.status === 'COMPLETED' || !!approvedTxn;

  if (isPaid) {
    const update: Record<string, unknown> = {
      status: 'paid',
      paymentStatus: 'paid',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (payment.amount_paid) update.amountPaid = Number(payment.amount_paid);
    const lastDigits = approvedTxn?.payment_method?.card?.last_digits;
    if (lastDigits) update.cardLastDigits = lastDigits;
    await orderRef.update(update);
    logger.info('clipWebhook: order marked paid', { id });
  } else if (payment.status === 'FAILED') {
    await orderRef.update({
      status: 'cancelled',
      paymentStatus: 'failed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    logger.info('clipWebhook: order marked failed', { id });
  }

  res.json({ received: true });
});
