import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUser, updateUser } from '../lib/firestore';
import type { AppUser } from '../types';

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  previewMode: boolean;
  setPreviewMode: (val: boolean) => void;
  logout: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  previewMode: false,
  setPreviewMode: () => {},
  logout: async () => {},
  updateName: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const appUser = await getUser(firebaseUser.uid);
          if (appUser) {
            if (!cancelled) setUser(appUser);
          } else {
            if (!cancelled) setUser({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'Usuario',
              email: firebaseUser.email ?? '',
              role: 'customer',
              pushToken: null,
              createdAt: new Date(),
            });
          }
        } else {
          if (!cancelled) { setUser(null); setPreviewMode(false); }
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    setPreviewMode(false);
    await signOut(auth);
  };

  const updateName = async (name: string) => {
    if (!user || !auth.currentUser) return;
    await updateUser(user.uid, { name });
    await firebaseUpdateProfile(auth.currentUser, { displayName: name });
    setUser(prev => prev ? { ...prev, name } : null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, previewMode, setPreviewMode, logout, updateName }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
