import { useEffect, useState } from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Props { publishableKey: string; children: React.ReactNode }

export function StripeWrapper({ publishableKey, children }: Props) {
  // Prefer the publishable key configured in the admin panel; fall back to the env key.
  const [pk, setPk] = useState(publishableKey);

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'stripe'), (snap) => {
      const configured = snap.data()?.publishableKey as string | undefined;
      if (configured) setPk(configured);
    });
  }, []);

  return <StripeProvider publishableKey={pk}>{children}</StripeProvider>;
}
