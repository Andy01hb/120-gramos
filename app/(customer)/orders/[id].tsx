import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Colors } from '../../../constants/colors';
import type { Order } from '../../../types';

const STEPS: Order['status'][] = ['paid', 'preparing', 'ready', 'completed'];
const STEP_LABEL: Partial<Record<Order['status'], string>> = {
  paid: 'Pedido confirmado',
  preparing: 'En preparación',
  ready: 'Listo para recoger',
  completed: 'Entregado',
};

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, 'orders', id), snap => {
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() } as Order);
      } else {
        setNotFound(true);
      }
    });
  }, [id]);

  if (notFound) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 16 }}>Pedido no encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) return null;
  const currentStep = STEPS.indexOf(order.status);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Pedido #{order.id.slice(-4).toUpperCase()}</Text>

        {/* Progress stepper */}
        {order.status === 'cancelled' ? (
          <View style={[styles.stepper, { borderLeftWidth: 3, borderLeftColor: Colors.error }]}>
            <Text style={{ color: Colors.error, fontWeight: '700' }}>Pedido cancelado</Text>
          </View>
        ) : (
          <View style={styles.stepper}>
            {STEPS.map((step, i) => (
              <View key={step} style={styles.stepRow}>
                <View style={[styles.stepDot, i <= currentStep && styles.stepDotActive]} />
                <Text style={[styles.stepLabel, i <= currentStep && styles.stepLabelActive]}>{STEP_LABEL[step]}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tu pedido</Text>
          {order.items.map((item) => (
            <View key={item.productId} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.quantity}× {item.name}{item.addBoba ? ' + Boba' : ''}</Text>
              <Text style={styles.itemPrice}>${item.unitPrice * item.quantity}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${order.subtotal} MXN</Text>
          </View>
        </View>

        {order.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notas</Text>
            <Text style={styles.notes}>{order.notes}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, gap: 16 },
  title: { fontSize: 26, fontWeight: '900', color: Colors.primary },
  stepper: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, gap: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.border },
  stepDotActive: { backgroundColor: Colors.primary },
  stepLabel: { fontSize: 14, color: Colors.textSecondary },
  stepLabelActive: { color: Colors.text, fontWeight: '700' },
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, gap: 10 },
  cardTitle: { fontSize: 12, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { fontSize: 14, color: Colors.text, flex: 1 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
  totalValue: { fontSize: 20, fontWeight: '900', color: Colors.primary },
  notes: { fontSize: 14, color: Colors.text },
});
