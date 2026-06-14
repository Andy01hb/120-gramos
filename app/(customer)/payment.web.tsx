import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { app } from '../../lib/firebase';
import { useCart } from '../../contexts/CartContext';
import { CColors } from '../../constants/colors';

// Web-only file: the publishable key is guaranteed by the guard in app/_layout.tsx
const stripePromise = loadStripe(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentScreenWeb() {
  const { notes } = useLocalSearchParams<{ notes?: string }>();
  const { items, subtotal } = useCart();
  const router = useRouter();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;

    (async () => {
      try {
        const fns = getFunctions(app, 'us-central1');
        const createPI = httpsCallable(fns, 'createPaymentIntent');
        const result = await createPI({ items, notes });
        if (cancelled) return;

        const data = result.data as { clientSecret: string; paymentIntentId: string };
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? 'No pudimos preparar el pago. Intenta de nuevo.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (items.length === 0) {
    return (
      <Centered>
        <Text style={styles.title}>Tu carrito está vacío</Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/(customer)/menu')}>
          <Text style={styles.secondaryBtnText}>Ver el menú</Text>
        </TouchableOpacity>
      </Centered>
    );
  }

  if (error) {
    return (
      <Centered>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>No se pudo iniciar el pago</Text>
        <Text style={styles.sub}>{error}</Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryBtnText}>← Volver</Text>
        </TouchableOpacity>
      </Centered>
    );
  }

  if (!clientSecret || !paymentIntentId) {
    return (
      <Centered>
        <ActivityIndicator size="large" color={CColors.primary} />
        <Text style={styles.sub}>Preparando tu pago seguro...</Text>
      </Centered>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Pago seguro</Text>
        <Text style={styles.amount}>${subtotal} MXN</Text>
        <Text style={styles.sub}>Procesado por Stripe · Tarjeta de crédito o débito</Text>

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'night',
              variables: {
                colorPrimary: CColors.primary,
                colorBackground: CColors.surface,
                colorText: CColors.text,
                borderRadius: '10px',
              },
            },
          }}
        >
          <CheckoutForm subtotal={subtotal} paymentIntentId={paymentIntentId} />
        </Elements>
      </ScrollView>
    </SafeAreaView>
  );
}

function CheckoutForm({ subtotal, paymentIntentId }: { subtotal: number; paymentIntentId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { clear } = useCart();

  const [processing, setProcessing] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handlePay() {
    if (!stripe || !elements) return;
    setProcessing(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Used only for payment methods that require a redirect; cards stay on-page.
        return_url: `${window.location.origin}/confirmation?paymentIntentId=${paymentIntentId}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message ?? 'El pago no se pudo completar. Revisa tus datos.');
      setProcessing(false);
      return;
    }

    // Payment succeeded without a redirect (card). The order is created by the
    // stripeWebhook Cloud Function; confirmation.tsx waits for that document.
    clear();
    router.replace({ pathname: '/(customer)/confirmation', params: { paymentIntentId } });
  }

  return (
    <View style={styles.formCard}>
      <PaymentElement onReady={() => setReady(true)} />

      {message && <Text style={styles.error}>{message}</Text>}

      <TouchableOpacity
        style={[styles.payBtn, (!stripe || !ready || processing) && styles.payBtnDisabled]}
        onPress={handlePay}
        disabled={!stripe || !ready || processing}
      >
        {processing ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.payBtnText}>Pagar ${subtotal} MXN</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.note}>🔒 Tu pago está cifrado y protegido por Stripe.</Text>
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centered}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CColors.background },
  scroll: { padding: 24, gap: 10, maxWidth: 480, width: '100%', alignSelf: 'center' },
  centered: { flex: 1, padding: 32, justifyContent: 'center', alignItems: 'center', gap: 16 },
  icon: { fontSize: 56 },
  title: { fontSize: 26, fontWeight: '900', color: CColors.primary, textAlign: 'center' },
  amount: { fontSize: 40, fontWeight: '900', color: CColors.text },
  sub: { fontSize: 13, color: CColors.textSecondary, textAlign: 'center', lineHeight: 20 },
  formCard: {
    marginTop: 20,
    backgroundColor: CColors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: CColors.border,
  },
  error: { fontSize: 13, color: CColors.error, textAlign: 'center' },
  payBtn: {
    backgroundColor: CColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { fontSize: 16, fontWeight: '900', color: '#000' },
  secondaryBtn: {
    marginTop: 8,
    backgroundColor: CColors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '800', color: '#000' },
  note: { fontSize: 11, color: CColors.textSecondary, textAlign: 'center' },
});
