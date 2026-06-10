import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width > 600;

  async function handleSend() {
    const trimmed = email.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, trimmed);
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, isWide && styles.cardWide]}>
          {sent ? (
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>📬</Text>
              <Text style={styles.successTitle}>Correo enviado</Text>
              <Text style={styles.successBody}>
                Si existe una cuenta con ese correo, recibirás un link para restablecer tu contraseña.
                {'\n\n'}Revisa también tu carpeta de spam.
              </Text>
              <Button label="Volver al inicio de sesión" onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 8 }} />
            </View>
          ) : (
            <>
              <Text style={styles.title}>Recuperar contraseña</Text>
              <Text style={styles.subtitle}>
                Ingresa tu correo y te enviaremos un link para crear una nueva contraseña.
              </Text>
              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  placeholderTextColor={Colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoFocus
                />
                <Button label="Enviar link de recuperación" onPress={handleSend} loading={loading} style={{ marginTop: 8 }} />
                <Button label="Volver" onPress={() => router.back()} variant="ghost" />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  scrollWide: { alignItems: 'center', paddingVertical: 64 },

  card: { width: '100%' },
  cardWide: {
    maxWidth: 440,
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 48,
  },

  title: { fontSize: 24, fontWeight: '900', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 20 },
  form: { gap: 12 },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12, padding: 14,
    color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.border,
  },

  successBox: { gap: 12, alignItems: 'center' },
  successIcon: { fontSize: 56 },
  successTitle: { fontSize: 24, fontWeight: '900', color: Colors.text },
  successBody: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
