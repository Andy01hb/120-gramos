import { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { CColors } from '../../constants/colors';

export default function CheckoutScreen() {
  const { items, subtotal } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const isWeb = Platform.OS === 'web';

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: CColors.textSecondary, fontSize: 16 }}>Tu carrito está vacío.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, isWeb && styles.scrollWeb]} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Confirmar pedido</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tu pedido</Text>
          {items.map((item, i) => (
            <View key={`${item.productId}-${i}`} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.quantity}× {item.name}</Text>
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
            placeholderTextColor={CColors.textSecondary}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CColors.background },
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  scrollWeb: { maxWidth: 600, alignSelf: 'center', width: '100%', paddingTop: 32 },
  title: { fontSize: 26, fontWeight: '900', color: CColors.primary },
  card: {
    backgroundColor: CColors.surface, borderRadius: 16, padding: 14, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: 11, fontWeight: '800', color: CColors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { fontSize: 14, color: CColors.text, flex: 1 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: CColors.text },
  divider: { height: 1, backgroundColor: CColors.border },
  totalLabel: { fontSize: 16, fontWeight: '700', color: CColors.text },
  totalValue: { fontSize: 20, fontWeight: '900', color: CColors.primary },
  infoRow: { fontSize: 14, color: CColors.text },
  notesInput: {
    backgroundColor: CColors.surfaceAlt, borderRadius: 10, padding: 12,
    color: CColors.text, fontSize: 14, minHeight: 72, textAlignVertical: 'top',
    borderWidth: 1, borderColor: CColors.border,
  },
  note: { fontSize: 12, color: CColors.textSecondary, textAlign: 'center' },
});
