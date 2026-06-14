import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
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

    // Query by status so we only read the relevant orders (open orders are few),
    // instead of scanning every paid order ever. A date bound further caps history reads.
    const constraints: any[] = [];
    if (statusFilter?.length) constraints.push(where('status', 'in', statusFilter));
    if (fromDate) constraints.push(where('createdAt', '>=', Timestamp.fromDate(fromDate)));
    // orderBy createdAt so the query uses the existing (status, createdAt DESC) index
    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(collection(db, 'orders'), ...constraints);

    const unsubscribe = onSnapshot(q, snap => {
      if (!active) return;
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      all.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
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
