import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import type { StatPeriod } from '../../hooks/useDashboardStats';
import { useMenu } from '../../hooks/useMenu';
import { useStand } from '../../contexts/StandContext';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { setStandOpen, updateOrderStatus } from '../../lib/firestore';
import { OrderCard } from '../../components/admin/OrderCard';
import { Colors } from '../../constants/colors';

const PERIODS: { key: StatPeriod; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: '7 días' },
  { key: 'month', label: 'Este mes' },
];

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  onPress?: () => void;
}

function KpiCard({ label, value, sub, accent = Colors.primary, onPress }: KpiCardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={[styles.kpiCard, { borderTopColor: accent }]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color: accent }]}>{value}</Text>
      {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </Wrapper>
  );
}

export default function DashboardScreen() {
  const [period, setPeriod] = useState<StatPeriod>('today');
  const { stats, loading } = useDashboardStats(period);
  const { items } = useMenu();
  const { isOpen, loading: standLoading } = useStand();
  const { orders: activeOrders } = useAdminOrders(['paid', 'preparing']);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  const unavailableCount = items.filter(i => !i.available).length;
  const kpiColumns = isWeb && width > 900 ? 4 : isWeb ? 3 : 2;

  const periodLabel = period === 'today' ? 'hoy' : period === 'week' ? 'últimos 7 días' : 'este mes';

  async function handleStandToggle() {
    await setStandOpen(!isOpen);
  }

  async function handleAdvanceOrder(orderId: string, currentStatus: string) {
    if (currentStatus === 'paid') await updateOrderStatus(orderId, 'preparing');
    else if (currentStatus === 'preparing') await updateOrderStatus(orderId, 'ready');
  }

  return (
    <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
      <ScrollView contentContainerStyle={[styles.scroll, isWeb && styles.scrollWeb]}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <TouchableOpacity
            style={[styles.standToggle, isOpen ? styles.standOpen : styles.standClosed]}
            onPress={handleStandToggle}
            disabled={standLoading}
          >
            <View style={[styles.standDot, { backgroundColor: isOpen ? Colors.success : Colors.error }]} />
            <Text style={[styles.standText, { color: isOpen ? Colors.success : Colors.error }]}>
              {isOpen ? 'ABIERTO' : 'CERRADO'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active orders queue (always live) */}
        {activeOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pedidos en curso</Text>
              <TouchableOpacity onPress={() => router.navigate('/(admin)/orders')}>
                <Text style={styles.sectionLink}>Ver todos</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.orderGrid, isWeb && width > 900 && styles.orderGridWide]}>
              {activeOrders.slice(0, isWeb ? 6 : 3).map(order => (
                <View key={order.id} style={isWeb && width > 900 ? { width: '50%', paddingHorizontal: 4 } : {}}>
                  <OrderCard
                    order={order}
                    onPress={() => router.push(`/(admin)/orders/${order.id}`)}
                    onAction={() => handleAdvanceOrder(order.id, order.status)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {activeOrders.length === 0 && (
          <View style={styles.emptyQueue}>
            <Text style={styles.emptyQueueIcon}>☕</Text>
            <Text style={styles.emptyQueueText}>Sin pedidos activos</Text>
            <Text style={styles.emptyQueueSub}>Los nuevos pedidos aparecerán aquí en tiempo real</Text>
          </View>
        )}

        {/* Period picker */}
        <View style={styles.metricsHeader}>
          <Text style={styles.sectionTitle}>Métricas</Text>
          <View style={styles.periodRow}>
            {PERIODS.map(p => (
              <TouchableOpacity
                key={p.key}
                style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
                onPress={() => setPeriod(p.key)}
              >
                <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* KPI Grid */}
        <View style={[styles.kpiGrid, { flexDirection: 'row', flexWrap: 'wrap' }]}>
          <View style={{ width: `${100 / kpiColumns}%`, padding: 4 }}>
            <KpiCard
              label="Pedidos"
              value={loading ? '—' : stats.totalOrders}
              sub={`Recibidos ${periodLabel}`}
              accent={Colors.primary}
            />
          </View>
          <View style={{ width: `${100 / kpiColumns}%`, padding: 4 }}>
            <KpiCard
              label="Ingresos"
              value={loading ? '—' : `$${stats.totalRevenue}`}
              sub={`MXN ${periodLabel}`}
              accent={Colors.primary}
            />
          </View>
          <View style={{ width: `${100 / kpiColumns}%`, padding: 4 }}>
            <KpiCard
              label="Entregados"
              value={loading ? '—' : stats.completedOrders}
              sub={`Completados ${periodLabel}`}
              accent={Colors.success}
            />
          </View>
          <View style={{ width: `${100 / kpiColumns}%`, padding: 4 }}>
            <KpiCard
              label="Menú"
              value={`${items.length - unavailableCount}/${items.length}`}
              sub={unavailableCount > 0 ? `${unavailableCount} no disponible${unavailableCount !== 1 ? 's' : ''}` : 'Todo disponible'}
              accent={unavailableCount > 0 ? Colors.error : Colors.success}
              onPress={() => router.navigate('/(admin)/menu-mgmt')}
            />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, gap: 20, paddingBottom: 32 },
  scrollWeb: { padding: 32, maxWidth: 1200, alignSelf: 'center', width: '100%' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 30, fontWeight: '900', color: Colors.primary },
  date: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  standToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  standOpen: { backgroundColor: '#1a2a1a' },
  standClosed: { backgroundColor: '#2a1a1a' },
  standDot: { width: 8, height: 8, borderRadius: 4 },
  standText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  sectionLink: { fontSize: 13, color: Colors.primary, fontWeight: '700' },

  orderGrid: { gap: 10 },
  orderGridWide: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },

  emptyQueue: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyQueueIcon: { fontSize: 40 },
  emptyQueueText: { fontSize: 16, fontWeight: '800', color: Colors.text },
  emptyQueueSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },

  metricsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  periodRow: { flexDirection: 'row', gap: 6 },
  periodBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  periodBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  periodText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  periodTextActive: { color: '#000' },

  kpiGrid: { marginHorizontal: -4 },
  kpiCard: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
    borderTopWidth: 3, gap: 4,
  },
  kpiLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiValue: { fontSize: 32, fontWeight: '900' },
  kpiSub: { fontSize: 12, color: Colors.textSecondary },
});
