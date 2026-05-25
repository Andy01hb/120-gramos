import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Order, OrderStatus } from '../types';

export function useAdminOrders(statusFilter?: OrderStatus[]) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setOrders([]);
    setLoading(true);
    const q = query(
      collection(db, 'orders'),
      where('paymentStatus', '==', 'paid'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, snap => {
      let all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      if (statusFilter?.length) all = all.filter(o => statusFilter.includes(o.status));
      setOrders(all);
      setLoading(false);
    });
    return unsubscribe;
  }, [JSON.stringify(statusFilter)]);

  return { orders, loading };
}
