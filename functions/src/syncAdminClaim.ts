import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

/**
 * Keeps the `admin` custom claim in sync with users/{uid}.role.
 * Storage rules read this claim (cross-service Firestore lookups are unreliable here).
 * Note: a user must get a fresh ID token (re-login or token refresh) for a new claim
 * to take effect.
 */
export const syncAdminClaim = onDocumentWritten('users/{uid}', async (event) => {
  const uid = event.params.uid;
  const after = event.data?.after?.data();
  const shouldBeAdmin = after?.role === 'admin';

  try {
    const user = await admin.auth().getUser(uid);
    const current = (user.customClaims ?? {}) as Record<string, unknown>;
    if ((current.admin === true) === shouldBeAdmin) return; // already in sync

    await admin.auth().setCustomUserClaims(uid, { ...current, admin: shouldBeAdmin });
    logger.info('syncAdminClaim: updated', { uid, admin: shouldBeAdmin });
  } catch (err: any) {
    logger.error('syncAdminClaim: failed', { uid, err: err?.message });
  }
});
