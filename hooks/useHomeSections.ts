import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { HomeSection } from '../types';

export function useHomeSections(): HomeSection[] {
  const [sections, setSections] = useState<HomeSection[]>([]);
  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'home'), snap => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.sections)) {
          setSections([...data.sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
        }
      }
    });
  }, []);
  return sections;
}
