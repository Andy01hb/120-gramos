import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { addSecretVersion } from './stripeConfig';

interface Input {
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  mode?: 'test' | 'live';
}

/**
 * Lets an admin configure the business's own Stripe keys from the panel.
 * Secrets (sk / whsec) go to Secret Manager only — never to Firestore, never back
 * to the client. settings/stripe holds only public/status info (pk, mode, last4).
 */
export const setStripeConfig = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión');

  const db = admin.firestore();
  const adminSnap = await db.doc(`users/${request.auth.uid}`).get();
  if (adminSnap.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo el personal puede configurar pagos');
  }

  const { publishableKey, secretKey, webhookSecret, mode } = request.data as Input;
  const m: 'test' | 'live' = mode === 'live' ? 'live' : 'test';

  // ── Publishable key (required, public) ──────────────────────────────────────
  if (!publishableKey || !/^pk_(test|live)_/.test(publishableKey)) {
    throw new HttpsError('invalid-argument', 'La clave publishable no es válida (debe empezar con pk_test_ o pk_live_).');
  }
  if (m === 'live' && !publishableKey.startsWith('pk_live_')) {
    throw new HttpsError('invalid-argument', 'En modo producción la publishable debe empezar con pk_live_.');
  }
  if (m === 'test' && !publishableKey.startsWith('pk_test_')) {
    throw new HttpsError('invalid-argument', 'En modo prueba la publishable debe empezar con pk_test_.');
  }

  // ── Secret key (optional on updates; validated against Stripe) ───────────────
  let secretLast4: string | undefined;
  if (secretKey) {
    if (!/^(sk|rk)_(test|live)_/.test(secretKey)) {
      throw new HttpsError('invalid-argument', 'La clave secreta no es válida (debe empezar con sk_...).');
    }
    if (m === 'live' && !/_live_/.test(secretKey)) {
      throw new HttpsError('invalid-argument', 'En modo producción la clave secreta debe ser de live.');
    }
    if (m === 'test' && !/_test_/.test(secretKey)) {
      throw new HttpsError('invalid-argument', 'En modo prueba la clave secreta debe ser de test.');
    }
    try {
      const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });
      await stripe.balance.retrieve(); // liveness check
    } catch {
      throw new HttpsError('invalid-argument', 'Stripe rechazó la clave secreta. Verifícala e inténtalo de nuevo.');
    }
    await addSecretVersion('STRIPE_SECRET_KEY', secretKey);
    secretLast4 = secretKey.slice(-4);
  }

  // ── Webhook signing secret (optional) ───────────────────────────────────────
  if (webhookSecret) {
    if (!/^whsec_/.test(webhookSecret)) {
      throw new HttpsError('invalid-argument', 'El webhook secret debe empezar con whsec_.');
    }
    await addSecretVersion('STRIPE_WEBHOOK_SECRET', webhookSecret);
  }

  // ── Public status doc (no secrets) ──────────────────────────────────────────
  const update: Record<string, unknown> = {
    publishableKey,
    mode: m,
    configured: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (secretLast4) update.secretKeyLast4 = secretLast4;
  if (webhookSecret) update.webhookConfigured = true;
  await db.doc('settings/stripe').set(update, { merge: true });

  return { ok: true, mode: m, secretKeyLast4: secretLast4 ?? null };
});
