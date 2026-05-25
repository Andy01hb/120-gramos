import * as admin from 'firebase-admin';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { Expo } from 'expo-server-sdk';
import type { ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export const notifyOrderReady = onDocumentUpdated('orders/{orderId}', async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after) return;
  if (before.status === after.status) return;
  if (after.status !== 'ready') return;

  const userId: string = after.userId;
  const orderId: string = event.params.orderId;
  const orderNum = orderId.slice(-4).toUpperCase();

  const userSnap = await admin.firestore().doc(`users/${userId}`).get();
  const pushToken: string | null = userSnap.data()?.pushToken ?? null;

  if (!pushToken || !Expo.isExpoPushToken(pushToken)) return;

  const message: ExpoPushMessage = {
    to: pushToken,
    sound: 'default',
    title: '¡Tu pedido está listo! 🎉',
    body: `El pedido #${orderNum} está listo para recoger en el stand.`,
    data: { orderId },
  };

  const chunks = expo.chunkPushNotifications([message]);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      console.error('Failed to send push notification:', err);
    }
  }
});
