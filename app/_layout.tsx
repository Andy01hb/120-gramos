import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function RootGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

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
  }, [user, loading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootGuard />
    </AuthProvider>
  );
}
