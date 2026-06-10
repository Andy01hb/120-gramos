import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type StatPeriod = 'today' | 'week' | 'month';

export interface DashboardStats {
  activeOrders: number;
  readyOrders: number;
  totalOrders: number;
  totalRevenue: number;
  completedOrders: number;
}

function getStartDate(period: StatPeriod): Date {
  const d = new Date();
  if (period === 'today') {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === 'week') {
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useDashboardStats(period: StatPeriod = 'today') {
  const [stats, setStats] = useState<DashboardStats>({
    activeOrders: 0,
    readyOrders: 0,
    totalOrders: 0,
    totalRevenue: 0,
    completedOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const startDate = getStartDate(period);
    const q = query(
      collection(db, 'orders'),
      where('paymentStatus', '==', 'paid'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
    );

    const unsubscribe = onSnapshot(q, snap => {
      if (!active) return;
      const orders = snap.docs.map(d => d.data());
      setStats({
        activeOrders: orders.filter(o => ['paid', 'preparing'].includes(o.status)).length,
        readyOrders: orders.filter(o => o.status === 'ready').length,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.subtotal ?? 0), 0),
        completedOrders: orders.filter(o => o.status === 'completed').length,
      });
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [period]);

  return { stats, loading };
}
