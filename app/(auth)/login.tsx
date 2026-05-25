import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Link } from 'expo-router';
import { auth } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // AuthContext detects change and _layout.tsx redirects automatically
    } catch (e: any) {
      Alert.alert('Error', 'Correo o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.logo}>120<Text style={styles.logoSub}>GRAMOS</Text></Text>
        <Text style={styles.tagline}>CAFE DE ALTURA</Text>
      </View>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor={Colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={Colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button label="Iniciar sesión" onPress={handleLogin} loading={loading} style={{ marginTop: 8 }} />
        <Link href="/(auth)/register" style={styles.link}>
          ¿No tienes cuenta? <Text style={{ color: Colors.primary }}>Regístrate</Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 52, fontWeight: '900', color: Colors.primary, letterSpacing: -2 },
  logoSub: { fontSize: 20, fontWeight: '700', letterSpacing: 2 },
  tagline: { fontSize: 10, fontWeight: '700', letterSpacing: 8, color: Colors.textSecondary, marginTop: 4 },
  form: { gap: 12 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.border,
  },
  link: { textAlign: 'center', marginTop: 16, color: Colors.textSecondary, fontSize: 14 },
});
