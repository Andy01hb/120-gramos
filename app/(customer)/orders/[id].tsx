import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { CColors } from '../../../constants/colors';
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
          <Text style={{ color: CColors.textSecondary, fontSize: 16 }}>Pedido no encontrado.</Text>
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

        {order.status === 'cancelled' ? (
          <View style={[styles.stepper, styles.cancelledCard]}>
            <Text style={{ color: CColors.error, fontWeight: '800', fontSize: 15 }}>Pedido cancelado</Text>
          </View>
        ) : (
          <View style={styles.stepper}>
            {STEPS.map((step, i) => {
              const isActive = i <= currentStep;
              const isCurrent = i === currentStep;
              return (
                <View key={step} style={styles.stepRow}>
                  <View style={[styles.stepDot, isActive && styles.stepDotActive, isCurrent && styles.stepDotCurrent]} />
                  <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                    {STEP_LABEL[step]}
                    {isCurrent && <Text style={styles.stepCurrent}> ← ahora</Text>}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tu pedido</Text>
          {order.items.map((item) => (
            <View key={item.productId} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.quantity}× {item.name}</Text>
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
  safe: { flex: 1, backgroundColor: CColors.background },
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '900', color: CColors.primary },

  stepper: {
    backgroundColor: CColors.surface, borderRadius: 16, padding: 16, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cancelledCard: { borderLeftWidth: 3, borderLeftColor: CColors.error },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: CColors.border },
  stepDotActive: { backgroundColor: CColors.primary },
  stepDotCurrent: { width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: CColors.primary, backgroundColor: '#fff' },
  stepLabel: { fontSize: 14, color: CColors.textSecondary },
  stepLabelActive: { color: CColors.text, fontWeight: '700' },
  stepCurrent: { fontSize: 12, color: CColors.primary, fontWeight: '600' },

  card: {
    backgroundColor: CColors.surface, borderRadius: 16, padding: 14, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: 11, fontWeight: '800', color: CColors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { fontSize: 14, color: CColors.text, flex: 1 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: CColors.text },
  divider: { height: 1, backgroundColor: CColors.border },
  totalLabel: { fontSize: 16, fontWeight: '700', color: CColors.text },
  totalValue: { fontSize: 20, fontWeight: '900', color: CColors.primary },
  notes: { fontSize: 14, color: CColors.text, lineHeight: 20 },
});
