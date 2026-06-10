import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import type { Order } from '../../types';

const ACTION_LABEL: Partial<Record<Order['status'], string>> = {
  paid: 'Iniciar preparación',
  preparing: 'Marcar como listo',
  ready: 'Marcar como entregado',
};

const ACTION_COLOR: Partial<Record<Order['status'], string>> = {
  paid: Colors.primary,
  preparing: Colors.success,
  ready: Colors.primary,
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
  ready: 'Listo para recoger',
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
  const color = STATUS_COLOR[order.status];
  const actionLabel = ACTION_LABEL[order.status];
  const actionColor = ACTION_COLOR[order.status] ?? Colors.primary;

  const createdMs =
    typeof (order.createdAt as any)?.toMillis === 'function'
      ? (order.createdAt as any).toMillis()
      : order.createdAt instanceof Date
        ? (order.createdAt as Date).getTime()
        : null;
  const elapsed = createdMs !== null ? Math.round((Date.now() - createdMs) / 60000) : null;

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Colored status band */}
      <View style={[styles.statusBand, { backgroundColor: color + '28' }]}>
        <View style={styles.bandLeft}>
          <Text style={styles.orderId}>#{order.id.slice(-4).toUpperCase()}</Text>
          <View style={[styles.statusPill, { backgroundColor: color }]}>
            <Text style={styles.statusPillText}>{STATUS_LABEL[order.status]}</Text>
          </View>
        </View>
        {elapsed !== null && (
          <Text style={styles.elapsed}>hace {elapsed < 1 ? '<1' : elapsed} min</Text>
        )}
      </View>

      {/* Card body */}
      <View style={styles.body}>
        <Text style={styles.client}>{order.userName}</Text>
        <Text style={styles.items} numberOfLines={2}>
          {order.items.map(i => `${i.quantity}× ${i.name}`).join(' · ')}
        </Text>
        {order.notes ? <Text style={styles.notes}>📝 {order.notes}</Text> : null}
        <Text style={styles.total}>${order.subtotal} MXN</Text>

        {actionLabel && onAction && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: actionColor }]}
            onPress={onAction}
            disabled={actionLoading}
          >
            <Text style={styles.actionText}>
              {actionLoading ? 'Actualizando...' : actionLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderLeftWidth: 5,
  },

  statusBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bandLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderId: { fontSize: 18, fontWeight: '900', color: Colors.text },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  elapsed: { fontSize: 11, color: Colors.textSecondary },

  body: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 8, gap: 5 },
  client: { fontSize: 15, fontWeight: '700', color: Colors.text },
  items: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  notes: { fontSize: 12, color: Colors.primary, fontStyle: 'italic' },
  total: { fontSize: 15, fontWeight: '900', color: Colors.primary },

  actionBtn: {
    borderRadius: 10,
    padding: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  actionText: { fontSize: 14, fontWeight: '900', color: '#000' },
});
