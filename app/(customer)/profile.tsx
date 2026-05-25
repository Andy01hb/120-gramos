import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.card}>
          <Text style={styles.cardRow}>📍 Plaza de los Enamorados · Río Bravo, Tamps.</Text>
          <Text style={styles.cardRow}>🗓 Sáb y Dom · Desde 5:00 PM</Text>
          <Text style={styles.cardRow}>📱 @120gramosriobravo</Text>
        </View>
        <Button label="Cerrar sesión" onPress={handleLogout} variant="ghost" style={{ marginTop: 16 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1, padding: 24, alignItems: 'center', gap: 12, paddingTop: 40 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 36, fontWeight: '900', color: '#000' },
  name: { fontSize: 24, fontWeight: '900', color: Colors.text },
  email: { fontSize: 14, color: Colors.textSecondary },
  card: { width: '100%', backgroundColor: Colors.surface, borderRadius: 14, padding: 16, gap: 10, marginTop: 8 },
  cardRow: { fontSize: 14, color: Colors.text },
});
