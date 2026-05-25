import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Order, OrderStatus } from '../types';

export function useAdminOrders(statusFilter?: OrderStatus[]) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('paymentStatus', '==', 'paid'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, snap => {
      let all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      if (statusFilter?.length) all = all.filter(o => statusFilter.includes(o.status));
      setOrders(all);
      setLoading(false);
    });
  }, []);

  return { orders, loading };
}
