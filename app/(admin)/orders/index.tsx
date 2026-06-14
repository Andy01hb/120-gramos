import { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdminOrders } from '../../../hooks/useAdminOrders';
import { updateOrderStatus, setStandOpen } from '../../../lib/firestore';
import { useStand } from '../../../contexts/StandContext';
import { Colors } from '../../../constants/colors';
import type { Order, OrderStatus } from '../../../types';

type Tab = 'active' | 'done';

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

const NEXT_COLOR: Partial<Record<OrderStatus, string>> = {
  paid: Colors.primary,
  preparing: Colors.success,
  ready: Colors.primary,
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_payment: Colors.textSecondary,
  paid: Colors.primary,
  preparing: '#FF9800',
  ready: Colors.success,
  completed: Colors.textSecondary,
  cancelled: Colors.error,
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Procesando',
  paid: 'Nuevo pedido',
  preparing: 'En preparación',
  ready: 'Listo para entregar',
  completed: 'Entregado',
  cancelled: 'Cancelado',
};

// Where the order was paid. Older orders without paymentMethod are app/web (Stripe).
function payBadge(order: Order): { label: string; color: string } {
  switch (order.paymentMethod) {
    case 'clip': return { label: '💳 Caja', color: '#5B8DEF' };
    case 'cash': return { label: '💵 Efectivo', color: Colors.success };
    default:     return { label: '📱 App', color: Colors.primary };
  }
}

function elapsedLabel(createdAt: any): string {
  const ms = typeof createdAt?.toMillis === 'function' ? createdAt.toMillis()
    : createdAt instanceof Date ? createdAt.getTime() : 0;
  if (!ms) return '';
  const min = Math.round((Date.now() - ms) / 60000);
  return `hace ${min < 1 ? '<1' : min} min`;
}

function ActiveOrderCard({ order, onAction, loading }: {
  order: Order;
  onAction: () => void;
  loading: boolean;
}) {
  const color = STATUS_COLOR[order.status];
  const actionLabel = NEXT_LABEL[order.status];
  const actionColor = NEXT_COLOR[order.status] ?? Colors.primary;

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      {/* Band */}
      <View style={[styles.band, { backgroundColor: color + '22' }]}>
        <View style={styles.bandLeft}>
          <Text style={styles.orderId}>#{order.id.slice(-4).toUpperCase()}</Text>
          <View style={[styles.statusPill, { backgroundColor: color }]}>
            <Text style={styles.statusPillText}>{STATUS_LABEL[order.status]}</Text>
          </View>
          <View style={[styles.payPill, { borderColor: payBadge(order).color }]}>
            <Text style={[styles.payPillText, { color: payBadge(order).color }]}>{payBadge(order).label}</Text>
          </View>
        </View>
        <Text style={styles.elapsed}>{elapsedLabel(order.createdAt)}</Text>
      </View>

      <View style={styles.body}>
        {/* Client */}
        <Text style={styles.client}>{order.userName}</Text>

        {/* Items with full selections detail */}
        <View style={styles.itemsList}>
          {order.items.map((item, i) => (
            <View key={i} style={styles.itemBlock}>
              <Text style={styles.itemName}>{item.quantity}× {item.name}</Text>
              {item.selections && item.selections.length > 0 && (
                <View style={styles.selectionsList}>
                  {item.selections.map(sel => (
                    <View key={sel.optionId} style={styles.selRow}>
                      <Text style={styles.selBullet}>›</Text>
                      <Text style={styles.selText}>
                        <Text style={styles.selQ}>{sel.question}:</Text>
                        <Text style={styles.selA}> {sel.answer}</Text>
                        {sel.extraPrice > 0
                          ? <Text style={styles.selExtra}> (+${sel.extraPrice})</Text>
                          : null}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {order.notes ? <Text style={styles.notes}>📝 {order.notes}</Text> : null}

        {/* Total + action */}
        <View style={styles.cardFooter}>
          <Text style={styles.total}>${order.subtotal} MXN</Text>
          {actionLabel && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: actionColor }]}
              onPress={onAction}
              disabled={loading}
            >
              <Text style={styles.actionText}>
                {loading ? 'Actualizando...' : actionLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

function DoneOrderCard({ order }: { order: Order }) {
  const color = STATUS_COLOR[order.status];
  return (
    <View style={[styles.doneCard, { borderLeftColor: color }]}>
      <View style={styles.doneTop}>
        <View style={styles.bandLeft}>
          <Text style={styles.orderId}>#{order.id.slice(-4).toUpperCase()}</Text>
          <View style={[styles.statusPill, { backgroundColor: color + '30' }]}>
            <Text style={[styles.statusPillText, { color }]}>{STATUS_LABEL[order.status]}</Text>
          </View>
          <View style={[styles.payPill, { borderColor: payBadge(order).color }]}>
            <Text style={[styles.payPillText, { color: payBadge(order).color }]}>{payBadge(order).label}</Text>
          </View>
        </View>
        <Text style={styles.elapsed}>{elapsedLabel(order.createdAt)}</Text>
      </View>
      <Text style={styles.client}>{order.userName}</Text>
      <Text style={styles.doneItems} numberOfLines={2}>
        {order.items.map(i => `${i.quantity}× ${i.name}`).join(' · ')}
      </Text>
      <Text style={styles.total}>${order.subtotal} MXN</Text>
    </View>
  );
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function AdminOrdersScreen() {
  const [tab, setTab] = useState<Tab>('active');
  const today = useMemo(() => startOfToday(), []);
  const { orders: activeOrders, loading: loadingActive } = useAdminOrders(['paid', 'preparing', 'ready']);
  const { orders: doneOrders, loading: loadingDone } = useAdminOrders(['completed', 'cancelled'], today);
  const { isOpen } = useStand();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const isWeb = Platform.OS === 'web';

  async function handleAction(order: Order) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setLoadingId(order.id);
    try { await updateOrderStatus(order.id, next); }
    catch { Alert.alert('Error', 'No se pudo actualizar el pedido.'); }
    finally { setLoadingId(null); }
  }

  async function handleStandToggle() {
    if (toggling) return;
    setToggling(true);
    try { await setStandOpen(!isOpen); }
    catch { Alert.alert('Error', 'No se pudo cambiar el estado del stand.'); }
    finally { setToggling(false); }
  }

  const orders = tab === 'active' ? activeOrders : doneOrders;
  const loading = tab === 'active' ? loadingActive : loadingDone;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, isWeb && styles.headerWeb]}>
        <Text style={styles.title}>Pedidos</Text>
        <TouchableOpacity
          style={[styles.standToggle, isOpen ? styles.standOpen : styles.standClosed]}
          onPress={handleStandToggle}
          disabled={toggling}
        >
          <View style={[styles.dot, { backgroundColor: isOpen ? Colors.success : Colors.error }]} />
          <Text style={[styles.standText, { color: isOpen ? Colors.success : Colors.error }]}>
            {isOpen ? 'ABIERTO' : 'CERRADO'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.tabs, isWeb && styles.tabsWeb]}>
        <TouchableOpacity
          style={[styles.tab, tab === 'active' && styles.tabActive]}
          onPress={() => setTab('active')}
        >
          <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>
            Activos{activeOrders.length > 0 ? ` (${activeOrders.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'done' && styles.tabActive]}
          onPress={() => setTab('done')}
        >
          <Text style={[styles.tabText, tab === 'done' && styles.tabTextActive]}>
            Entregados hoy{doneOrders.length > 0 ? ` (${doneOrders.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        renderItem={({ item }) =>
          tab === 'active'
            ? <ActiveOrderCard order={item} onAction={() => handleAction(item)} loading={loadingId === item.id} />
            : <DoneOrderCard order={item} />
        }
        contentContainerStyle={[styles.list, isWeb && styles.listWeb]}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>{tab === 'active' ? '☕' : '✓'}</Text>
              <Text style={styles.emptyText}>
                {tab === 'active' ? 'Sin pedidos activos' : 'Sin pedidos entregados hoy'}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerWeb: { maxWidth: 860, alignSelf: 'center', width: '100%' },
  title: { fontSize: 26, fontWeight: '900', color: Colors.primary },
  standToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  standOpen: { backgroundColor: '#1a2a1a' },
  standClosed: { backgroundColor: '#2a1a1a' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  standText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tabsWeb: { maxWidth: 860, alignSelf: 'center', width: '100%' },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: Colors.surface, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: '#000', fontWeight: '900' },

  list: { padding: 16, paddingTop: 4 },
  listWeb: { maxWidth: 860, alignSelf: 'center', width: '100%' },

  // ── Active card ──
  card: {
    backgroundColor: Colors.surface, borderRadius: 14,
    overflow: 'hidden', borderLeftWidth: 5,
  },
  band: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  bandLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderId: { fontSize: 18, fontWeight: '900', color: Colors.text },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  payPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  payPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.2 },
  elapsed: { fontSize: 11, color: Colors.textSecondary },

  body: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 8, gap: 10 },
  client: { fontSize: 15, fontWeight: '800', color: Colors.text },

  itemsList: { gap: 8 },
  itemBlock: { gap: 3 },
  itemName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  selectionsList: { paddingLeft: 10, gap: 2 },
  selRow: { flexDirection: 'row', gap: 4 },
  selBullet: { fontSize: 13, color: Colors.primary, fontWeight: '900', lineHeight: 19 },
  selText: { fontSize: 13, lineHeight: 19, flex: 1 },
  selQ: { color: Colors.textSecondary, fontWeight: '600' },
  selA: { color: Colors.text, fontWeight: '700' },
  selExtra: { color: Colors.primary, fontWeight: '700' },

  notes: { fontSize: 12, color: Colors.primary, fontStyle: 'italic' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 2 },
  total: { fontSize: 16, fontWeight: '900', color: Colors.primary },
  actionBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  actionText: { fontSize: 13, fontWeight: '900', color: '#000' },

  // ── Done card ──
  doneCard: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderLeftWidth: 4, padding: 14, gap: 4,
  },
  doneTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  doneItems: { fontSize: 13, color: Colors.textSecondary },

  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, fontWeight: '600' },
});
