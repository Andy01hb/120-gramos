import React, { createContext, useContext, useEffect, useState } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface StandContextValue { isOpen: boolean; loading: boolean }
const StandContext = createContext<StandContextValue>({ isOpen: true, loading: true });

export function StandProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'stand'), (snap) => {
      if (snap.exists()) setIsOpen(snap.data().isOpen ?? true);
      setLoading(false);
    });
  }, []);

  return <StandContext.Provider value={{ isOpen, loading }}>{children}</StandContext.Provider>;
}

export const useStand = () => useContext(StandContext);
