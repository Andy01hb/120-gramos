import { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useOrders } from '../../hooks/useOrders';
import { CColors } from '../../constants/colors';
import type { Order } from '../../types';
import type { Timestamp } from 'firebase/firestore';

const STATUS_LABEL: Record<Order['status'], string> = {
  pending_payment: 'Procesando',
  paid: 'Confirmado',
  preparing: 'En preparación',
  ready: '¡Listo!',
  completed: 'Entregado',
  cancelled: 'Cancelado',
};
const STATUS_COLOR: Record<Order['status'], string> = {
  pending_payment: CColors.textSecondary,
  paid: CColors.primary,
  preparing: '#E67E00',
  ready: CColors.success,
  completed: CColors.textSecondary,
  cancelled: CColors.error,
};

function formatDate(ts: Timestamp | Date): string {
  const d = 'toDate' in ts ? ts.toDate() : ts;
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatMemberSince(ts: Timestamp | Date): string {
  const d = 'toDate' in ts ? ts.toDate() : ts;
  return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
}

export default function ProfileScreen() {
  const { user, logout, updateName } = useAuth();
  const { orders } = useOrders();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);

  const recentOrders = orders.slice(0, 3);

  async function handleSaveName() {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === user?.name) { setEditing(false); return; }
    setSaving(true);
    try {
      await updateName(trimmed);
      setEditing(false);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el nombre.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordReset() {
    if (!user?.email) return;
    const confirmed = Platform.OS === 'web'
      ? window.confirm(`Enviaremos un link de restablecimiento a:\n${user.email}`)
      : await new Promise<boolean>(resolve =>
          Alert.alert('Cambiar contraseña', `Te enviaremos un link a:\n${user.email}`, [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Enviar', onPress: () => resolve(true) },
          ])
        );
    if (!confirmed) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert('Correo enviado', 'Revisa tu bandeja de entrada y sigue las instrucciones.');
    } catch {
      Alert.alert('Error', 'No se pudo enviar el correo. Intenta de nuevo.');
    }
  }

  function handleLogout() {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Cerrar sesión?')) logout();
      return;
    }
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  }

  const isWeb = Platform.OS === 'web';

  return (
    <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
      <ScrollView contentContainerStyle={[styles.scroll, isWeb && styles.scrollWeb]} keyboardShouldPersistTaps="handled">

        {/* Header / avatar */}
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>

          {editing ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                maxLength={40}
                selectTextOnFocus
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName} disabled={saving}>
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.saveBtnText}>Guardar</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setNameInput(user?.name ?? ''); setEditing(false); }}>
                <Text style={styles.cancelBtn}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.nameRow} onPress={() => setEditing(true)}>
              <Text style={styles.name}>{user?.name}</Text>
              <Text style={styles.editIcon}>✎</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.email}>{user?.email}</Text>
          {user?.createdAt && (
            <Text style={styles.memberSince}>
              Miembro desde {formatMemberSince(user.createdAt)}
            </Text>
          )}
        </View>

        {/* Pedidos recientes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pedidos recientes</Text>
            {orders.length > 3 && (
              <TouchableOpacity onPress={() => router.push('/(customer)/orders')}>
                <Text style={styles.seeAll}>Ver todos</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentOrders.length === 0 ? (
            <View style={styles.emptyOrders}>
              <Text style={styles.emptyOrdersText}>Aún no tienes pedidos</Text>
            </View>
          ) : (
            recentOrders.map(order => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => router.push(`/(customer)/orders/${order.id}`)}
              >
                <View style={styles.orderTop}>
                  <Text style={styles.orderId}>#{order.id.slice(-4).toUpperCase()}</Text>
                  <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[order.status] + '18' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[order.status] }]}>
                      {STATUS_LABEL[order.status]}
                    </Text>
                  </View>
                </View>
                <Text style={styles.orderItems} numberOfLines={1}>
                  {order.items.map(i => `${i.quantity}× ${i.name}`).join(' · ')}
                </Text>
                <View style={styles.orderBottom}>
                  <Text style={styles.orderTotal}>${order.subtotal} MXN</Text>
                  {order.createdAt && (
                    <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Cuenta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuRow} onPress={handlePasswordReset}>
              <Text style={styles.menuRowText}>Cambiar contraseña</Text>
              <Text style={styles.menuRowArrow}>›</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/(customer)/orders')}>
              <Text style={styles.menuRowText}>Ver todos mis pedidos</Text>
              <Text style={styles.menuRowArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info del stand */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>El stand</Text>
          <View style={styles.standCard}>
            <Text style={styles.standRow}>📍 Plaza de los Enamorados · Río Bravo, Tamps.</Text>
            <Text style={styles.standRow}>🗓 Sáb y Dom · Desde 5:00 PM</Text>
            <Text style={styles.standRow}>📱 @120gramosriobravo</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CColors.background },
  scroll: { padding: 16, gap: 20, paddingBottom: 40 },
  scrollWeb: { maxWidth: 720, alignSelf: 'center', width: '100%', paddingHorizontal: 24, paddingTop: 32 },

  headerCard: {
    backgroundColor: CColors.surface, borderRadius: 20, padding: 24,
    alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: CColors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: { fontSize: 36, fontWeight: '900', color: '#fff' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 22, fontWeight: '900', color: CColors.text },
  editIcon: { fontSize: 16, color: CColors.textSecondary },
  editRow: { alignItems: 'center', gap: 8, width: '100%' },
  nameInput: {
    backgroundColor: CColors.background, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    color: CColors.text, fontSize: 18, fontWeight: '700', textAlign: 'center',
    borderWidth: 1.5, borderColor: CColors.primary, width: '80%',
  },
  saveBtn: {
    backgroundColor: CColors.primary, borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 8, minWidth: 80, alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  cancelBtn: { fontSize: 13, color: CColors.textSecondary },
  email: { fontSize: 14, color: CColors.textSecondary },
  memberSince: { fontSize: 12, color: CColors.textSecondary, marginTop: 2 },

  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: CColors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  seeAll: { fontSize: 13, color: CColors.primary, fontWeight: '700' },

  emptyOrders: { backgroundColor: CColors.surface, borderRadius: 14, padding: 20, alignItems: 'center' },
  emptyOrdersText: { color: CColors.textSecondary, fontSize: 14 },
  orderCard: {
    backgroundColor: CColors.surface, borderRadius: 14, padding: 14, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 15, fontWeight: '900', color: CColors.text },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  orderItems: { fontSize: 13, color: CColors.textSecondary },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTotal: { fontSize: 15, fontWeight: '900', color: CColors.primary },
  orderDate: { fontSize: 12, color: CColors.textSecondary },

  menuCard: { backgroundColor: CColors.surface, borderRadius: 14, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  menuRowText: { fontSize: 15, color: CColors.text },
  menuRowArrow: { fontSize: 20, color: CColors.textSecondary },
  menuDivider: { height: 1, backgroundColor: CColors.border, marginHorizontal: 16 },

  standCard: {
    backgroundColor: CColors.surfaceWarm, borderRadius: 14, padding: 16, gap: 10,
    borderWidth: 1, borderColor: CColors.border,
  },
  standRow: { fontSize: 14, color: CColors.text },

  logoutBtn: {
    borderWidth: 1.5, borderColor: CColors.error, borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: CColors.error },
});
