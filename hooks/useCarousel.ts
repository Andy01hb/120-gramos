import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useCarousel() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'carousel'), snap => {
      setImages(snap.exists() ? (snap.data().images ?? []) : []);
      setLoading(false);
    });
  }, []);

  return { images, loading };
}
