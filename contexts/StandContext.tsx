import React, { createContext, useContext, useEffect, useState } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isStandOpenNow } from '../lib/standHours';
import type { StandSettings } from '../types';

interface StandContextValue {
  isOpen: boolean;
  loading: boolean;
  settings: StandSettings | null;
}
const StandContext = createContext<StandContextValue>({ isOpen: true, loading: true, settings: null });

export function StandProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StandSettings | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // Listen to the stand settings doc
  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'stand'), (snap) => {
      setSettings(snap.exists() ? (snap.data() as StandSettings) : null);
      setLoading(false);
    });
  }, []);

  // Recompute effective open state; in auto mode, tick so it flips on schedule
  useEffect(() => {
    const recompute = () => setIsOpen(isStandOpenNow(settings));
    recompute();
    if (settings?.mode === 'auto') {
      const id = setInterval(recompute, 30000);
      return () => clearInterval(id);
    }
  }, [settings]);

  return (
    <StandContext.Provider value={{ isOpen, loading, settings }}>{children}</StandContext.Provider>
  );
}

export const useStand = () => useContext(StandContext);
