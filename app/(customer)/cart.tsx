import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCart } from '../../contexts/CartContext';
import { useStand } from '../../contexts/StandContext';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import type { OrderItem } from '../../types';

function CartRow({ item, onRemove, onQty }: { item: OrderItem; onRemove: () => void; onQty: (q: number) => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{item.name}</Text>
        {item.flavors.length > 0 && <Text style={styles.rowSub}>{item.flavors.join(', ')}</Text>}
        {item.addBoba && <Text style={styles.rowSub}>+ Boba</Text>}
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
        ? <View style={styles.empty}><Text style={styles.emptyText}>Tu carrito está vacío</Text></View>
        : (
          <>
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
              contentContainerStyle={styles.list}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
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
          </>
        )
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.primary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
  list: { padding: 16 },
  row: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  rowInfo: { flex: 1, gap: 3 },
  rowName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  rowSub: { fontSize: 12, color: Colors.textSecondary },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  qBtnText: { fontSize: 18, color: Colors.text, fontWeight: '300' },
  qNum: { fontSize: 16, fontWeight: '700', color: Colors.text, minWidth: 20, textAlign: 'center' },
  rowPrice: { fontSize: 14, fontWeight: '900', color: Colors.primary },
  remove: { fontSize: 11, color: Colors.error, fontWeight: '700' },
  footer: { padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
  totalValue: { fontSize: 22, fontWeight: '900', color: Colors.primary },
  closedNote: { fontSize: 12, color: Colors.error, textAlign: 'center' },
});
