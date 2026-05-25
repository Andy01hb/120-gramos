import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAdminOrders } from '../../../hooks/useAdminOrders';
import { updateOrderStatus, setStandOpen } from '../../../lib/firestore';
import { OrderCard } from '../../../components/admin/OrderCard';
import { useStand } from '../../../contexts/StandContext';
import { Colors } from '../../../constants/colors';
import type { Order, OrderStatus } from '../../../types';

type Tab = 'active' | 'ready' | 'done';

const TAB_FILTERS: Record<Tab, OrderStatus[]> = {
  active: ['paid', 'preparing'],
  ready: ['ready'],
  done: ['completed', 'cancelled'],
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: 'preparing',
  preparing: 'ready',
};

export default function AdminOrdersScreen() {
  const [tab, setTab] = useState<Tab>('active');
  const { orders } = useAdminOrders(TAB_FILTERS[tab]);
  const { isOpen } = useStand();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  async function handleAction(order: Order) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setLoadingId(order.id);
    await updateOrderStatus(order.id, next);
    setLoadingId(null);
  }

  async function handleStandToggle() {
    if (toggling) return;
    setToggling(true);
    try {
      await setStandOpen(!isOpen);
    } catch {
      Alert.alert('Error', 'No se pudo cambiar el estado del stand.');
    } finally {
      setToggling(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Pedidos</Text>
        <TouchableOpacity
          style={[styles.standToggle, isOpen ? styles.standOpen : styles.standClosed]}
          onPress={handleStandToggle}
          disabled={toggling}
        >
          <View style={[styles.toggleDot, { backgroundColor: isOpen ? Colors.success : Colors.error }]} />
          <Text style={[styles.toggleText, { color: isOpen ? Colors.success : Colors.error }]}>
            {isOpen ? 'ABIERTO' : 'CERRADO'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {(['active', 'ready', 'done'] as Tab[]).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'active' ? 'Activos' : t === 'ready' ? 'Listos' : 'Historial'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => router.push(`/(admin)/orders/${item.id}`)}
            onAction={() => handleAction(item)}
            actionLoading={loadingId === item.id}
          />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={<Text style={styles.empty}>Sin pedidos en esta sección</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 26, fontWeight: '900', color: Colors.primary },
  standToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  standOpen: { backgroundColor: '#1a2a1a' },
  standClosed: { backgroundColor: '#2a1a1a' },
  toggleDot: { width: 8, height: 8, borderRadius: 4 },
  toggleText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.surface, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: '#000' },
  list: { padding: 16, paddingTop: 4 },
  empty: { textAlign: 'center', color: Colors.textSecondary, marginTop: 40, fontSize: 15 },
});
