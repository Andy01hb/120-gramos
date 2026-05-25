import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePaymentSheet } from '@stripe/stripe-react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../lib/firebase';
import { useCart } from '../../contexts/CartContext';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';

export default function PaymentScreen() {
  const { notes } = useLocalSearchParams<{ notes?: string }>();
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet, loading } = usePaymentSheet();
  const [ready, setReady] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState('');

  useEffect(() => {
    async function initSheet() {
      try {
        const fns = getFunctions(app);
        const createPI = httpsCallable(fns, 'createPaymentIntent');
        const result = await createPI({ items, notes });
        const { clientSecret, paymentIntentId: piId } = result.data as { clientSecret: string; paymentIntentId: string };
        setPaymentIntentId(piId);

        const { error: sheetError } = await initPaymentSheet({
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: '120 GRAMOS',
          style: 'alwaysDark',
          primaryButtonLabel: `Pagar $${subtotal} MXN`,
        });
        if (sheetError) {
          Alert.alert('Error', sheetError.message, [{ text: 'OK', onPress: () => router.back() }]);
          return;
        }
        setReady(true);
      } catch {
        Alert.alert('Error', 'No pudimos preparar el pago. Intenta de nuevo.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    }
    initSheet();
  }, []); // runs once on mount; items/subtotal/notes are stable at this point

  async function handlePay() {
    const { error } = await presentPaymentSheet();
    if (error) {
      Alert.alert('Pago fallido', error.message);
      return;
    }
    clear();
    if (!paymentIntentId) return;
    router.replace({ pathname: '/(customer)/confirmation', params: { paymentIntentId } });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Pago seguro</Text>
        <Text style={styles.amount}>${subtotal} MXN</Text>
        <Text style={styles.sub}>Procesado por Stripe · Tarjeta de crédito o débito</Text>
        <Button label={`Pagar $${subtotal} MXN`} onPress={handlePay} loading={loading || !ready} style={{ marginTop: 24 }} />
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
  note: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
