import { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePaymentSheet } from '@stripe/stripe-react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../lib/firebase';
import { useCart } from '../../contexts/CartContext';
import { Colors } from '../../constants/colors';

export default function PaymentScreen() {
  const { notes } = useLocalSearchParams<{ notes?: string }>();
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();
  const [statusMsg, setStatusMsg] = useState('Preparando tu pago...');
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;

    async function run() {
      try {
        const fns = getFunctions(app, 'us-central1');
        const createPI = httpsCallable(fns, 'createPaymentIntent');
        const result = await createPI({ items, notes });
        if (cancelled.current) return;

        const { clientSecret, paymentIntentId } = result.data as {
          clientSecret: string;
          paymentIntentId: string;
        };

        setStatusMsg('Cargando método de pago...');
        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: '120 GRAMOS',
          style: 'alwaysDark',
          primaryButtonLabel: `Pagar $${subtotal} MXN`,
        });
        if (cancelled.current) return;
        if (initError) {
          Alert.alert('Error', initError.message, [{ text: 'OK', onPress: () => router.back() }]);
          return;
        }

        const { error: presentError } = await presentPaymentSheet();
        if (cancelled.current) return;

        if (!presentError) {
          clear();
          router.replace({
            pathname: '/(customer)/confirmation',
            params: { paymentIntentId },
          });
        } else if (presentError.code === 'Canceled') {
          router.back();
        } else {
          Alert.alert('Pago fallido', presentError.message, [{ text: 'OK', onPress: () => router.back() }]);
        }
      } catch (e: any) {
        if (!cancelled.current) {
          Alert.alert('Error', e?.message ?? 'No pudimos preparar el pago. Intenta de nuevo.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        }
      }
    }

    run();

    return () => { cancelled.current = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Pago seguro</Text>
        <Text style={styles.amount}>${subtotal} MXN</Text>
        <Text style={styles.sub}>Procesado por Stripe · Tarjeta de crédito o débito</Text>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 32 }} />
        <Text style={styles.status}>{statusMsg}</Text>
        <Text style={styles.note}>Tu pago está cifrado y protegido.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 12 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.primary },
  amount: { fontSize: 42, fontWeight: '900', color: Colors.text },
  sub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  status: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  note: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
