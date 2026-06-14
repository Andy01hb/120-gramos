import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  selections: Array<{ optionId: string; question: string; answer: string; extraPrice: number }>;
}

/**
 * Validates every item against Firestore prices — never trust client-supplied
 * prices — and returns the server-trusted subtotal in MXN pesos.
 * Throws HttpsError on any invalid item. Shared by createPaymentIntent (Stripe)
 * and createCounterOrder (Clip / cash).
 */
export async function validateOrderItems(items: OrderItem[]): Promise<number> {
  if (!items?.length) throw new HttpsError('invalid-argument', 'El carrito está vacío');

  const db = admin.firestore();
  let subtotal = 0;

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

  return subtotal;
}
