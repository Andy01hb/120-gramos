import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStand } from '../../contexts/StandContext';
import { setStandOpen } from '../../lib/firestore';
import { Colors } from '../../constants/colors';

export default function StandScreen() {
  const { isOpen, loading } = useStand();

  async function toggle() {
    await setStandOpen(!isOpen);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Control del stand</Text>

        <View style={[styles.card, isOpen ? styles.cardOpen : styles.cardClosed]}>
          <Text style={styles.statusEmoji}>{isOpen ? '🟢' : '🔴'}</Text>
          <Text style={styles.statusLabel}>{isOpen ? 'ABIERTO' : 'CERRADO'}</Text>
          <Text style={styles.statusSub}>
            {isOpen
              ? 'Los clientes pueden hacer pedidos ahora'
              : 'Los pedidos están deshabilitados para los clientes'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.toggleBtn, isOpen ? styles.toggleBtnClose : styles.toggleBtnOpen]}
          onPress={toggle}
          disabled={loading}
        >
          <Text style={styles.toggleBtnText}>
            {isOpen ? 'Cerrar el stand' : 'Abrir el stand'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Este cambio afecta a todos los clientes en tiempo real. Al cerrar, no podrán agregar productos al carrito ni ordenar.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1, padding: 24, gap: 20, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '900', color: Colors.primary, textAlign: 'center' },
  card: { borderRadius: 20, padding: 32, alignItems: 'center', gap: 10 },
  cardOpen: { backgroundColor: '#1a2a1a' },
  cardClosed: { backgroundColor: '#2a1a1a' },
  statusEmoji: { fontSize: 52 },
  statusLabel: { fontSize: 28, fontWeight: '900', color: Colors.text, letterSpacing: 2 },
  statusSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  toggleBtn: { borderRadius: 16, padding: 18, alignItems: 'center' },
  toggleBtnClose: { backgroundColor: Colors.error },
  toggleBtnOpen: { backgroundColor: Colors.success },
  toggleBtnText: { fontSize: 18, fontWeight: '900', color: '#fff' },
  note: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
