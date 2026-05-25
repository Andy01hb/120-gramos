import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useOrders } from '../../../hooks/useOrders';
import { Colors } from '../../../constants/colors';
import type { Order } from '../../../types';

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
  paid: 'Confirmado',
  preparing: 'En preparación',
  ready: '¡Listo para recoger!',
  completed: 'Entregado',
  cancelled: 'Cancelado',
};

export default function MyOrdersScreen() {
  const { orders, loading } = useOrders();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Text style={styles.title}>Mis pedidos</Text></View>
      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/(customer)/orders/${item.id}`)}>
            <View style={styles.cardTop}>
              <Text style={styles.orderId}>#{item.id.slice(-4).toUpperCase()}</Text>
              <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[item.status] + '22' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
              </View>
            </View>
            <Text style={styles.items}>{item.items.map(i => `${i.quantity}× ${i.name}`).join(' · ')}</Text>
            <Text style={styles.total}>${item.subtotal} MXN</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Aún no tienes pedidos</Text> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.primary },
  list: { padding: 16 },
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, gap: 6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 16, fontWeight: '900', color: Colors.text },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  items: { fontSize: 13, color: Colors.textSecondary },
  total: { fontSize: 15, fontWeight: '900', color: Colors.primary },
  empty: { textAlign: 'center', color: Colors.textSecondary, marginTop: 40, fontSize: 15 },
});
