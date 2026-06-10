import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface HomeSettings {
  section1Title: string;
  section1ImageUrl: string | null;
  section2Title: string;
  section2ImageUrl: string | null;
}

const DEFAULTS: HomeSettings = {
  section1Title: 'MÁS VENDIDOS',
  section1ImageUrl: null,
  section2Title: 'FAVORITOS',
  section2ImageUrl: null,
};

export function useHomeSettings(): HomeSettings {
  const [settings, setSettings] = useState<HomeSettings>(DEFAULTS);

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'home'), snap => {
      if (snap.exists()) {
        setSettings({ ...DEFAULTS, ...(snap.data() as Partial<HomeSettings>) });
      }
    });
  }, []);

  return settings;
}
