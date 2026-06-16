import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StripeWrapper } from '../components/StripeWrapper';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { StandProvider } from '../contexts/StandContext';
import { CartProvider } from '../contexts/CartContext';
import { takePostLoginRedirect } from '../lib/authRedirect';
import { useFonts } from 'expo-font';
import { APP_FONTS } from '../lib/fonts';
import * as Notifications from 'expo-notifications';
import NetInfo from '@react-native-community/netinfo';
import { Toast } from '../components/ui/Toast';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function RootGuard() {
  const { user, loading, previewMode } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      setOffline(!(state.isConnected ?? true));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    const inAdmin = segments[0] === '(admin)';
    const inCustomer = segments[0] === '(customer)';

    if (!user) {
      // Guests may browse the customer area; only the admin area is gated.
      if (inAdmin) router.replace('/login');
      return;
    }
    if (user.role === 'admin' && !inAdmin && !previewMode) {
      takePostLoginRedirect(); // discard any stale guest redirect
      router.replace('/(admin)');
      return;
    }
    if (user.role === 'customer' && !inCustomer) {
      // After login, return the guest to where they were headed (e.g. checkout)
      const redirect = takePostLoginRedirect();
      router.replace((redirect ?? '/(customer)') as any);
    }
  }, [user, loading, segments[0], previewMode]);

  return (
    <>
      <Slot />
      <Toast message="Sin conexión a internet" visible={offline} type="error" />
    </>
  );
}

export default function RootLayout() {
  const stripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!stripeKey) throw new Error('Missing env var: EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY');

  // Load custom fonts for section titles. We don't block render: titles fall back
  // to the system font until these are ready (a brief, harmless swap).
  useFonts(APP_FONTS);

  return (
    <StripeWrapper publishableKey={stripeKey}>
      <AuthProvider>
        <StandProvider>
          <CartProvider>
            <RootGuard />
          </CartProvider>
        </StandProvider>
      </AuthProvider>
    </StripeWrapper>
  );
}
