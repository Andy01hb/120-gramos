import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import type { Order } from '../../types';

const STATUS_LABELS: Record<Order['status'], string> = {
  pending_payment: 'Procesando pago...',
  paid: 'Pago confirmado · Enviado a la vendedora',
  preparing: 'En preparación ☕',
  ready: '¡Tu pedido está listo! Ve a recogerlo',
  completed: 'Entregado. ¡Que lo disfrutes!',
  cancelled: 'Pedido cancelado',
};

export default function ConfirmationScreen() {
  const { paymentIntentId } = useLocalSearchParams<{ paymentIntentId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), where('paymentIntentId', '==', paymentIntentId));
    const unsub = onSnapshot(q, snap => {
      if (!snap.empty) setOrder({ id: snap.docs[0].id, ...snap.docs[0].data() } as Order);
    });
    return unsub;
  }, [paymentIntentId]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        {!order ? (
          <>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.waiting}>Confirmando tu pedido...</Text>
          </>
        ) : (
          <>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.title}>¡Pedido recibido!</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>#{order.id.slice(-4).toUpperCase()}</Text></View>
            <Text style={styles.status}>{STATUS_LABELS[order.status]}</Text>
            <Text style={styles.sub}>Te avisaremos cuando esté listo para recoger en Plaza de los Enamorados.</Text>
            <Button label="Ver mis pedidos" onPress={() => router.replace('/(customer)/orders')} style={{ marginTop: 24 }} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 14 },
  waiting: { fontSize: 16, color: Colors.textSecondary, marginTop: 12 },
  check: { fontSize: 64, color: Colors.success },
  title: { fontSize: 28, fontWeight: '900', color: Colors.text },
  badge: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12 },
  badgeText: { fontSize: 22, fontWeight: '900', color: '#000', letterSpacing: 2 },
  status: { fontSize: 16, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  sub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
