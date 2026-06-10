import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

const DEFAULTS = ['Iced Coffee', 'Matcha', 'Otras'];

export function useCategories(): string[] {
  const [cats, setCats] = useState<string[]>(DEFAULTS);
  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'categories'), snap => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCats(data.categories);
        }
      }
    });
  }, []);
  return cats;
}
