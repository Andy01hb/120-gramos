import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { MenuItem } from '../types';

export function useMenu(category?: string) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const q = query(collection(db, 'menu'), orderBy('sortOrder'));
    const unsub = onSnapshot(
      q,
      snap => {
        if (!active) return;
        const all = snap.docs.map(d => ({ options: [], isFavorite: false, ...d.data(), id: d.id } as unknown as MenuItem));
        setItems(category ? all.filter(i => i.category === category) : all);
        setLoading(false);
      },
      _err => {
        if (!active) return;
        setError('No pudimos conectar con la barra. Inténtalo de nuevo más tarde.');
        setLoading(false);
      }
    );
    return () => { active = false; unsub(); };
  }, [category]);

  return { items, loading, error };
}
