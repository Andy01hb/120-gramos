import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { AppUser, Order } from '../types';

export async function getUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? ({ uid, ...snap.data() } as AppUser) : null;
}

export async function createUser(uid: string, data: Omit<AppUser, 'uid' | 'createdAt'>): Promise<void> {
  await setDoc(doc(db, 'users', uid), { ...data, createdAt: serverTimestamp() });
}

export async function updateUser(uid: string, data: { name: string }): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data);
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: serverTimestamp() });
}

export async function setStandOpen(isOpen: boolean): Promise<void> {
  await setDoc(doc(db, 'settings', 'stand'), { isOpen, updatedAt: serverTimestamp() });
}
