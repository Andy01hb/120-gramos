import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CColors } from '../../constants/colors';

export default function PaymentScreenWeb() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.icon}>📱</Text>
        <Text style={styles.title}>Pago disponible en la app</Text>
        <Text style={styles.sub}>
          Para pagar con tarjeta descarga la app de 120 GRAMOS en tu teléfono.
          Desde ahí puedes hacer tu pedido y pagarlo de forma segura con Stripe.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>← Volver al menú</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CColors.background },
  body: { flex: 1, padding: 32, justifyContent: 'center', alignItems: 'center', gap: 16 },
  icon: { fontSize: 64 },
  title: { fontSize: 22, fontWeight: '900', color: CColors.text, textAlign: 'center' },
  sub: { fontSize: 14, color: CColors.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 340 },
  btn: {
    marginTop: 8, backgroundColor: CColors.primary,
    borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14,
  },
  btnText: { fontSize: 15, fontWeight: '800', color: '#000' },
});
