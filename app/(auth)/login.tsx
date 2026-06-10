import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Link, useRouter } from 'expo-router';
import { auth } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width > 600;
  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    setLoginFailed(false);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      setLoginFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, isWide && styles.cardWide]}>
          <View style={styles.header}>
            <Text style={[styles.logo, isWide && styles.logoWide]}>
              120<Text style={styles.logoSub}>GRAMOS</Text>
            </Text>
            <Text style={styles.tagline}>CAFE DE ALTURA</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor={Colors.textSecondary}
              value={email}
              onChangeText={t => { setEmail(t); setLoginFailed(false); }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={Colors.textSecondary}
              value={password}
              onChangeText={t => { setPassword(t); setLoginFailed(false); }}
              secureTextEntry
            />

            {loginFailed && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>Correo o contraseña incorrectos.</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                  <Text style={styles.errorLink}>¿Olvidaste tu contraseña? Recupérala aquí →</Text>
                </TouchableOpacity>
              </View>
            )}

            <Button label="Iniciar sesión" onPress={handleLogin} loading={loading} style={{ marginTop: 4 }} />

            <Link href="/(auth)/register" style={styles.link}>
              ¿No tienes cuenta? <Text style={{ color: Colors.primary }}>Regístrate</Text>
            </Link>

            {!loginFailed && (
              <Link href="/(auth)/forgot-password" style={[styles.link, { marginTop: 4 }]}>
                <Text style={{ color: Colors.textSecondary }}>¿Olvidaste tu contraseña? </Text>
                <Text style={{ color: Colors.primary }}>Recupérala</Text>
              </Link>
            )}
          </View>
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
    maxWidth: 440, width: '100%',
    backgroundColor: Colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, padding: 48,
  },

  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 52, fontWeight: '900', color: Colors.primary, letterSpacing: -2 },
  logoWide: { fontSize: 60 },
  logoSub: { fontSize: 20, fontWeight: '700', letterSpacing: 2 },
  tagline: { fontSize: 10, fontWeight: '700', letterSpacing: 8, color: Colors.textSecondary, marginTop: 4 },

  form: { gap: 12 },
  input: {
    backgroundColor: Colors.background, borderRadius: 12, padding: 14,
    color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.border,
  },

  errorBox: {
    backgroundColor: '#2a1a1a', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: Colors.error + '55', gap: 8,
  },
  errorText: { fontSize: 13, color: Colors.error, fontWeight: '600' },
  errorLink: { fontSize: 13, color: Colors.primary, fontWeight: '700' },

  link: { textAlign: 'center', marginTop: 8, color: Colors.textSecondary, fontSize: 14 },
});
