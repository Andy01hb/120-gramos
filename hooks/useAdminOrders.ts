import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Order, OrderStatus } from '../types';

function toMs(ts: any): number {
  if (!ts) return 0;
  if (ts instanceof Timestamp) return ts.toMillis();
  if (ts?.toDate) return ts.toDate().getTime();
  return 0;
}

export function useAdminOrders(statusFilter?: OrderStatus[], fromDate?: Date) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const constraints: any[] = [where('paymentStatus', '==', 'paid')];
    if (fromDate) constraints.push(where('createdAt', '>=', Timestamp.fromDate(fromDate)));

    const q = query(collection(db, 'orders'), ...constraints);

    const unsubscribe = onSnapshot(q, snap => {
      if (!active) return;
      let all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      all.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
      if (statusFilter?.length) all = all.filter(o => statusFilter.includes(o.status));
      setOrders(all);
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [JSON.stringify(statusFilter), fromDate?.toISOString()]);

  return { orders, loading };
}
