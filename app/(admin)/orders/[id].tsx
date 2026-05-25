import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { updateOrderStatus } from '../../../lib/firestore';
import { Colors } from '../../../constants/colors';
import type { Order, OrderStatus } from '../../../types';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: 'preparing',
  preparing: 'ready',
  ready: 'completed',
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  paid: 'Iniciar preparación',
  preparing: 'Marcar como listo',
  ready: 'Marcar como entregado',
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_payment: Colors.textSecondary,
  paid: Colors.primary,
  preparing: '#FF9800',
  ready: Colors.success,
  completed: Colors.textSecondary,
  cancelled: Colors.error,
};

export default function AdminOrderDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, 'orders', id), snap => {
      if (snap.exists()) setOrder({ id: snap.id, ...snap.data() } as Order);
    });
  }, [id]);

  async function handleAdvance() {
    if (!order || loading) return;
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setLoading(true);
    try {
      await updateOrderStatus(order.id, next);
      if (next === 'completed') router.back();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el pedido. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (loading) return;
    Alert.alert('Cancelar pedido', '¿Seguro? Esta acción no se puede deshacer.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancelar pedido', style: 'destructive',
        onPress: async () => {
          if (!id) return;
          setLoading(true);
          try {
            await updateOrderStatus(id, 'cancelled');
            router.back();
          } catch {
            Alert.alert('Error', 'No se pudo cancelar el pedido.');
            setLoading(false);
          }
        },
      },
    ]);
  }

  if (!order) return null;
  const actionLabel = NEXT_LABEL[order.status];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>#{order.id.slice(-4).toUpperCase()}</Text>
          <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[order.status] + '22' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLOR[order.status] }]}>{order.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cliente</Text>
          <Text style={styles.clientName}>{order.userName}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Productos</Text>
          {order.items.map((item, i) => (
            <View key={item.productId ?? i} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.quantity}× {item.name}</Text>
                {item.flavors.length > 0 && <Text style={styles.itemSub}>Sabor: {item.flavors.join(', ')}</Text>}
                {item.addBoba && <Text style={styles.itemSub}>+ Boba</Text>}
              </View>
              <Text style={styles.itemPrice}>${item.unitPrice * item.quantity}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={styles.totalLabel}>Total cobrado</Text>
            <Text style={styles.totalValue}>${order.subtotal} MXN</Text>
          </View>
        </View>

        {order.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notas del cliente</Text>
            <Text style={styles.notes}>{order.notes}</Text>
          </View>
        )}

        {actionLabel && (
          <TouchableOpacity
            style={[styles.actionBtn, order.status === 'preparing' && styles.actionReady]}
            onPress={handleAdvance}
            disabled={loading}
          >
            <Text style={styles.actionText}>{loading ? 'Actualizando...' : actionLabel}</Text>
          </TouchableOpacity>
        )}

        {['paid', 'preparing'].includes(order.status) && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancelar pedido</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: Colors.primary },
  statusPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, gap: 10 },
  cardTitle: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  clientName: { fontSize: 18, fontWeight: '700', color: Colors.text },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  itemSub: { fontSize: 12, color: Colors.textSecondary },
  itemPrice: { fontSize: 14, fontWeight: '700', color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border },
  totalLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  totalValue: { fontSize: 20, fontWeight: '900', color: Colors.primary },
  notes: { fontSize: 14, color: Colors.text, fontStyle: 'italic' },
  actionBtn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  actionReady: { backgroundColor: Colors.success },
  actionText: { fontSize: 16, fontWeight: '900', color: '#000' },
  cancelBtn: { borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.error },
  cancelText: { fontSize: 15, fontWeight: '700', color: Colors.error },
});
