import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import type { Order } from '../../types';

const ACTION_LABEL: Partial<Record<Order['status'], string>> = {
  paid: 'Iniciar preparación',
  preparing: 'Marcar como listo',
};

const STATUS_COLOR: Record<Order['status'], string> = {
  pending_payment: Colors.textSecondary,
  paid: Colors.primary,
  preparing: '#FF9800',
  ready: Colors.success,
  completed: Colors.textSecondary,
  cancelled: Colors.error,
};

const STATUS_LABEL: Record<Order['status'], string> = {
  pending_payment: 'Procesando',
  paid: 'Nuevo',
  preparing: 'En preparación',
  ready: 'Listo',
  completed: 'Entregado',
  cancelled: 'Cancelado',
};

interface Props {
  order: Order;
  onPress: () => void;
  onAction?: () => void;
  actionLoading?: boolean;
}

export function OrderCard({ order, onPress, onAction, actionLoading }: Props) {
  const actionLabel = ACTION_LABEL[order.status];
  const elapsed = Math.round((Date.now() - (order.createdAt as any)?.toMillis?.()) / 60000);

  return (
    <TouchableOpacity style={[styles.card, { borderLeftColor: STATUS_COLOR[order.status] }]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.top}>
        <Text style={styles.orderId}>#{order.id.slice(-4).toUpperCase()}</Text>
        <View style={styles.topRight}>
          <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[order.status] + '22' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLOR[order.status] }]}>{STATUS_LABEL[order.status]}</Text>
          </View>
          <Text style={styles.elapsed}>hace {elapsed < 1 ? '<1' : elapsed} min</Text>
        </View>
      </View>

      <Text style={styles.client}>{order.userName}</Text>
      <Text style={styles.items} numberOfLines={2}>
        {order.items.map(i => `${i.quantity}× ${i.name}${i.addBoba ? ' +Boba' : ''}`).join(' · ')}
      </Text>
      {order.notes ? <Text style={styles.notes}>📝 {order.notes}</Text> : null}
      <Text style={styles.total}>${order.subtotal} MXN</Text>

      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.actionBtn, order.status === 'preparing' && styles.actionBtnReady]}
          onPress={onAction}
          disabled={actionLoading}
        >
          <Text style={styles.actionText}>{actionLoading ? 'Actualizando...' : actionLabel}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14, gap: 6,
    borderLeftWidth: 4,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderId: { fontSize: 18, fontWeight: '900', color: Colors.text },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  elapsed: { fontSize: 11, color: Colors.textSecondary },
  client: { fontSize: 15, fontWeight: '700', color: Colors.text },
  items: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  notes: { fontSize: 12, color: Colors.primary, fontStyle: 'italic' },
  total: { fontSize: 15, fontWeight: '900', color: Colors.primary },
  actionBtn: {
    backgroundColor: Colors.primary, borderRadius: 10, padding: 12,
    alignItems: 'center', marginTop: 4,
  },
  actionBtnReady: { backgroundColor: Colors.success },
  actionText: { fontSize: 14, fontWeight: '900', color: '#000' },
});
