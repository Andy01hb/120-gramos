import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useOrders } from '../../../hooks/useOrders';
import { useCart } from '../../../contexts/CartContext';
import { useStand } from '../../../contexts/StandContext';
import { Button } from '../../../components/ui/Button';
import { CColors } from '../../../constants/colors';
import { DEFAULT_CLOSED_MESSAGE } from '../../../lib/standHours';
import type { Order, OrderItem } from '../../../types';

const STATUS_COLOR: Record<Order['status'], string> = {
  pending_payment: CColors.textSecondary,
  paid: CColors.primary,
  preparing: '#E67E00',
  ready: CColors.success,
  completed: CColors.textSecondary,
  cancelled: CColors.error,
};

const STATUS_LABEL: Record<Order['status'], string> = {
  pending_payment: 'Procesando',
  paid: 'Confirmado',
  preparing: 'En preparación',
  ready: '¡Listo para recoger!',
  completed: 'Entregado',
  cancelled: 'Cancelado',
};

function CartItemRow({ item, onQty, onRemove }: {
  item: OrderItem;
  onQty: (q: number) => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.cartRow}>
      <View style={styles.cartRowInfo}>
        <Text style={styles.cartRowName}>{item.name}</Text>
        {item.selections?.map(s => (
          <Text key={s.optionId} style={styles.cartRowSub}>{s.question}: {s.answer}{s.extraPrice > 0 ? ` +$${s.extraPrice}` : ''}</Text>
        ))}
        {item.selections?.map(s => (
          <Text key={s.optionId} style={styles.cartRowSub}>{s.question}: {s.answer}{s.extraPrice > 0 ? ` +$${s.extraPrice}` : ''}</Text>
        ))}
      </View>
      <View style={styles.cartRowRight}>
        <View style={styles.qRow}>
          <TouchableOpacity style={styles.qBtn} onPress={() => onQty(item.quantity - 1)}>
            <Text style={styles.qBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qNum}>{item.quantity}</Text>
          <TouchableOpacity style={styles.qBtn} onPress={() => onQty(item.quantity + 1)}>
            <Text style={styles.qBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cartRowPrice}>${item.unitPrice * item.quantity}</Text>
        <TouchableOpacity onPress={onRemove}>
          <Text style={styles.remove}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const { items: cartItems, removeItem, updateQuantity, subtotal } = useCart();
  const { isOpen, settings } = useStand();
  const closedMsg = settings?.closedMessage || DEFAULT_CLOSED_MESSAGE;
  const { orders, loading } = useOrders();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  const hasCart = cartItems.length > 0;

  const listHeader = (
    <>
      {hasCart && (
        <View style={styles.cartSection}>
          <Text style={styles.sectionLabel}>TU PEDIDO</Text>
          {cartItems.map((item, i) => (
            <CartItemRow
              key={i}
              item={item}
              onQty={q => updateQuantity(item.productId, q)}
              onRemove={() => removeItem(item.productId)}
            />
          ))}
          <View style={styles.cartFooter}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${subtotal} MXN</Text>
            </View>
            <Button
              label="Continuar al pago"
              onPress={() => router.push('/(customer)/checkout')}
              disabled={!isOpen}
            />
            {!isOpen && <Text style={styles.closedNote}>{closedMsg}</Text>}
          </View>
        </View>
      )}
      {orders.length > 0 && (
        <Text style={[styles.sectionLabel, { marginTop: hasCart ? 8 : 0 }]}>HISTORIAL</Text>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, isWeb && styles.headerWeb]}>
        <Text style={styles.title}>Pedidos</Text>
        {hasCart && <Text style={styles.cartBadge}>{cartItems.reduce((s, i) => s + i.quantity, 0)} en carrito</Text>}
      </View>
      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/(customer)/orders/${item.id}` as any)}>
            <View style={styles.cardTop}>
              <Text style={styles.orderId}>#{item.id.slice(-4).toUpperCase()}</Text>
              <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[item.status] + '18' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
              </View>
            </View>
            <Text style={styles.orderItems} numberOfLines={1}>
              {item.items.map(i => `${i.quantity}× ${i.name}`).join(' · ')}
            </Text>
            <Text style={styles.orderTotal}>${item.subtotal} MXN</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={[styles.list, isWeb && styles.listWeb]}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          !loading && !hasCart ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🧾</Text>
              <Text style={styles.emptyText}>Aún no tienes pedidos</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CColors.background },
  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: CColors.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerWeb: { maxWidth: 760, alignSelf: 'center', width: '100%' },
  title: { fontSize: 26, fontWeight: '900', color: CColors.primary },
  cartBadge: { fontSize: 12, fontWeight: '700', color: CColors.primary },
  list: { padding: 16, paddingTop: 12 },
  listWeb: { maxWidth: 760, alignSelf: 'center', width: '100%' },
  sectionLabel: {
    fontSize: 10, fontWeight: '900', color: CColors.textSecondary,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10,
  },

  // ── Cart section ──
  cartSection: {
    backgroundColor: CColors.surface, borderRadius: 16,
    padding: 14, gap: 10, marginBottom: 6,
    borderWidth: 1, borderColor: CColors.border,
  },
  cartRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    gap: 10, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: CColors.border,
  },
  cartRowInfo: { flex: 1, gap: 2 },
  cartRowName: { fontSize: 14, fontWeight: '700', color: CColors.text },
  cartRowSub: { fontSize: 11, color: CColors.textSecondary },
  cartRowRight: { alignItems: 'flex-end', gap: 6 },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: CColors.surfaceAlt, borderWidth: 1, borderColor: CColors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  qBtnText: { fontSize: 16, color: CColors.text, fontWeight: '400' },
  qNum: { fontSize: 15, fontWeight: '700', color: CColors.text, minWidth: 18, textAlign: 'center' },
  cartRowPrice: { fontSize: 13, fontWeight: '900', color: CColors.primary },
  remove: { fontSize: 11, color: CColors.error, fontWeight: '700' },
  cartFooter: { gap: 10, paddingTop: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: CColors.text },
  totalValue: { fontSize: 20, fontWeight: '900', color: CColors.primary },
  closedNote: { fontSize: 12, color: CColors.error, textAlign: 'center' },

  // ── Order history ──
  card: {
    backgroundColor: CColors.surface, borderRadius: 14, padding: 14, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderLeftWidth: 3, borderLeftColor: CColors.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 16, fontWeight: '900', color: CColors.text },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  orderItems: { fontSize: 13, color: CColors.textSecondary },
  orderTotal: { fontSize: 15, fontWeight: '900', color: CColors.primary },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: CColors.textSecondary },
});
