import { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';

export default function CheckoutScreen() {
  const { items, subtotal } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Confirmar pedido</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tu pedido</Text>
          {items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.quantity}× {item.name}{item.addBoba ? ' + Boba' : ''}</Text>
              <Text style={styles.itemPrice}>${item.unitPrice * item.quantity}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={styles.totalLabel}>Total a pagar</Text>
            <Text style={styles.totalValue}>${subtotal} MXN</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Datos de recogida</Text>
          <Text style={styles.infoRow}>👤 {user?.name}</Text>
          <Text style={styles.infoRow}>📍 Plaza de los Enamorados · Río Bravo</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notas (opcional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Ej: sin hielo, doble shot..."
            placeholderTextColor={Colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={120}
          />
        </View>

        <Button
          label={`Pagar $${subtotal} MXN`}
          onPress={() => router.push({ pathname: '/(customer)/payment', params: { notes } })}
        />
        <Text style={styles.note}>El pago se procesa de forma segura con Stripe.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, gap: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.primary },
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, gap: 10 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { fontSize: 14, color: Colors.text, flex: 1 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
  totalValue: { fontSize: 20, fontWeight: '900', color: Colors.primary },
  infoRow: { fontSize: 14, color: Colors.text },
  notesInput: {
    backgroundColor: Colors.surfaceAlt, borderRadius: 10, padding: 12,
    color: Colors.text, fontSize: 14, minHeight: 72, textAlignVertical: 'top',
  },
  note: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
});
