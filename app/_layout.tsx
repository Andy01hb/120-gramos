import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { StandProvider } from '../contexts/StandContext';
import { CartProvider } from '../contexts/CartContext';
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
  const { user, loading } = useAuth();
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
      if (!inAuth && segments[0] !== 'splash') router.replace('/login');
      return;
    }
    if (user.role === 'admin' && !inAdmin) {
      router.replace('/(admin)/orders');
      return;
    }
    if (user.role === 'customer' && !inCustomer) {
      router.replace('/(customer)');
    }
  }, [user, loading, segments[0]]);

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

  return (
    <StripeProvider publishableKey={stripeKey}>
      <AuthProvider>
        <StandProvider>
          <CartProvider>
            <RootGuard />
          </CartProvider>
        </StandProvider>
      </AuthProvider>
    </StripeProvider>
  );
}
