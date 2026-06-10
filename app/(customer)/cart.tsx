import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCart } from '../../contexts/CartContext';
import { useStand } from '../../contexts/StandContext';
import { Button } from '../../components/ui/Button';
import { CColors } from '../../constants/colors';
import type { OrderItem } from '../../types';

function CartRow({ item, onRemove, onQty }: { item: OrderItem; onRemove: () => void; onQty: (q: number) => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{item.name}</Text>
        {item.selections?.map(s => (
          <Text key={s.optionId} style={styles.rowSub}>{s.question}: {s.answer}{s.extraPrice > 0 ? ` +$${s.extraPrice}` : ''}</Text>
        ))}
      </View>
      <View style={styles.rowRight}>
        <View style={styles.qtyRow}>
          <TouchableOpacity style={styles.qBtn} onPress={() => onQty(item.quantity - 1)}>
            <Text style={styles.qBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qNum}>{item.quantity}</Text>
          <TouchableOpacity style={styles.qBtn} onPress={() => onQty(item.quantity + 1)}>
            <Text style={styles.qBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.rowPrice}>${item.unitPrice * item.quantity}</Text>
        <TouchableOpacity onPress={onRemove}><Text style={styles.remove}>Eliminar</Text></TouchableOpacity>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();
  const { isOpen } = useStand();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Text style={styles.title}>Tu pedido</Text></View>
      {items.length === 0
        ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🛍️</Text>
            <Text style={styles.emptyText}>Tu carrito está vacío</Text>
          </View>
        )
        : (
          <View style={{ flex: 1 }}>
            <FlatList
              data={items}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <CartRow
                  item={item}
                  onRemove={() => removeItem(item.productId)}
                  onQty={(q) => updateQuantity(item.productId, q)}
                />
              )}
              style={{ flex: 1 }}
              contentContainerStyle={styles.list}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
            <View style={styles.footer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${subtotal} MXN</Text>
              </View>
              <Button
                label="Continuar al pago"
                onPress={() => router.push('/(customer)/checkout')}
                disabled={!isOpen}
              />
              {!isOpen && <Text style={styles.closedNote}>El stand está cerrado por ahora.</Text>}
            </View>
          </View>
        )
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CColors.background },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: CColors.border },
  title: { fontSize: 26, fontWeight: '900', color: CColors.primary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIcon: { fontSize: 52 },
  emptyText: { fontSize: 16, color: CColors.textSecondary },
  list: { padding: 16 },
  row: {
    backgroundColor: CColors.surface, borderRadius: 14, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  rowInfo: { flex: 1, gap: 3 },
  rowName: { fontSize: 14, fontWeight: '700', color: CColors.text },
  rowSub: { fontSize: 12, color: CColors.textSecondary },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: CColors.surfaceAlt, borderWidth: 1, borderColor: CColors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  qBtnText: { fontSize: 18, color: CColors.text, fontWeight: '400' },
  qNum: { fontSize: 16, fontWeight: '700', color: CColors.text, minWidth: 20, textAlign: 'center' },
  rowPrice: { fontSize: 14, fontWeight: '900', color: CColors.primary },
  remove: { fontSize: 11, color: CColors.error, fontWeight: '700' },
  footer: {
    padding: 16, gap: 12,
    borderTopWidth: 1, borderTopColor: CColors.border,
    backgroundColor: CColors.surface,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: CColors.text },
  totalValue: { fontSize: 22, fontWeight: '900', color: CColors.primary },
  closedNote: { fontSize: 12, color: CColors.error, textAlign: 'center' },
});
