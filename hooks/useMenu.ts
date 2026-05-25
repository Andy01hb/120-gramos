import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { MenuItem, MenuCategory } from '../types';

export function useMenu(category?: MenuCategory) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'menu'), orderBy('sortOrder'));
    return onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem));
      setItems(category ? all.filter(i => i.category === category) : all);
      setLoading(false);
    });
  }, [category]);

  return { items, loading };
}
