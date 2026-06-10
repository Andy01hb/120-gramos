import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/colors';

export default function AdminProfileScreen() {
  const { user, logout, setPreviewMode } = useAuth();
  const router = useRouter();

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

  function handlePreview() {
    setPreviewMode(true);
    router.replace('/(customer)' as any);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Perfil admin</Text>

        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? 'A'}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>ADMINISTRADOR</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.previewBtn} onPress={handlePreview}>
          <Text style={styles.previewIcon}>👁</Text>
          <View style={styles.previewTextWrap}>
            <Text style={styles.previewLabel}>Ver como cliente</Text>
            <Text style={styles.previewSub}>Navega la app como si fueras un cliente</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1, padding: 24, gap: 16 },
  title: { fontSize: 26, fontWeight: '900', color: Colors.primary },

  userCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 28,
    alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: { fontSize: 30, fontWeight: '900', color: '#000' },
  name: { fontSize: 20, fontWeight: '900', color: Colors.text },
  email: { fontSize: 13, color: Colors.textSecondary },
  roleBadge: {
    marginTop: 4, backgroundColor: Colors.primary + '22',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.primary + '44',
  },
  roleText: { fontSize: 10, fontWeight: '800', color: Colors.primary, letterSpacing: 1 },

  previewBtn: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  previewIcon: { fontSize: 28 },
  previewTextWrap: { flex: 1, gap: 2 },
  previewLabel: { fontSize: 15, fontWeight: '800', color: Colors.text },
  previewSub: { fontSize: 12, color: Colors.textSecondary },
  arrow: { fontSize: 22, color: Colors.textSecondary },

  logoutBtn: {
    borderWidth: 1.5, borderColor: Colors.error, borderRadius: 14,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.error },
});
