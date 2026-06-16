import * as admin from 'firebase-admin';
if (!admin.apps.length) {
  admin.initializeApp();
}

export { createPaymentIntent } from './createPaymentIntent';
export { stripeWebhook } from './stripeWebhook';
export { notifyOrderReady } from './notifyOrderReady';
export { createCounterOrder } from './createCounterOrder';
export { clipWebhook } from './clipWebhook';
export { syncAdminClaim } from './syncAdminClaim';
