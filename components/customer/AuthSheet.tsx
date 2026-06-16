import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { createUser } from '../../lib/firestore';
import { CColors } from '../../constants/colors';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

async function getPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null;
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return null;
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    return token.data;
  } catch {
    return null;
  }
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Login/registro como hoja emergente sobre el flujo de pedido.
 * El fondo atenuado deja ver que el pedido sigue ahí (no saca al usuario).
 */
export function AuthSheet({ visible, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!visible) return null;

  async function submit() {
    setError(null);
    if (mode === 'register') {
      if (!name.trim() || !email.trim() || password.length < 6) {
        setError('Completa tus datos. La contraseña debe tener al menos 6 caracteres.');
        return;
      }
    } else if (!email.trim() || !password) {
      setError('Escribe tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const pushToken = await getPushToken();
        await createUser(cred.user.uid, { name: name.trim(), email: email.trim(), role: 'customer', pushToken });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      onSuccess();
    } catch (e: any) {
      if (e?.code === 'auth/email-already-in-use') {
        setMode('login');
        setError('Ya existe una cuenta con este correo. Inicia sesión.');
      } else if (e?.code === 'auth/invalid-credential' || e?.code === 'auth/wrong-password' || e?.code === 'auth/user-not-found') {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError(e?.message ?? 'No se pudo continuar. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.overlay}>
      {/* Backdrop: tap to dismiss; deja ver el pedido detrás */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <ScrollView contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
          <View style={styles.handle} />
          <Text style={styles.title}>{mode === 'register' ? 'Crea tu cuenta para terminar' : 'Inicia sesión para terminar'}</Text>
          <Text style={styles.sub}>Tu pedido sigue guardado 👇. Solo necesitamos tus datos para continuar.</Text>

          <View style={styles.toggleRow}>
            <TouchableOpacity style={[styles.toggleBtn, mode === 'register' && styles.toggleActive]} onPress={() => { setMode('register'); setError(null); }}>
              <Text style={[styles.toggleText, mode === 'register' && styles.toggleTextActive]}>Crear cuenta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, mode === 'login' && styles.toggleActive]} onPress={() => { setMode('login'); setError(null); }}>
              <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>Ya tengo cuenta</Text>
            </TouchableOpacity>
          </View>

          {mode === 'register' && (
            <TextInput style={styles.input} placeholder="Tu nombre" placeholderTextColor={CColors.textSecondary} value={name} onChangeText={setName} />
          )}
          <TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor={CColors.textSecondary} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} placeholder={mode === 'register' ? 'Contraseña (mín. 6)' : 'Contraseña'} placeholderTextColor={CColors.textSecondary} value={password} onChangeText={setPassword} secureTextEntry />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitText}>{mode === 'register' ? 'Crear cuenta y continuar' : 'Iniciar sesión y continuar'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Seguir viendo el menú</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheetWrap: { width: '100%' },
  sheet: {
    backgroundColor: CColors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, gap: 12,
    borderTopWidth: 1, borderColor: CColors.border,
    maxWidth: 480, width: '100%', alignSelf: 'center',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: CColors.border, alignSelf: 'center', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '900', color: CColors.primary, textAlign: 'center' },
  sub: { fontSize: 13, color: CColors.textSecondary, textAlign: 'center', lineHeight: 19 },
  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  toggleBtn: { flex: 1, paddingVertical: 9, borderRadius: 20, alignItems: 'center', borderWidth: 1.5, borderColor: CColors.border, backgroundColor: CColors.surface },
  toggleActive: { backgroundColor: CColors.primary, borderColor: CColors.primary },
  toggleText: { fontSize: 13, fontWeight: '700', color: CColors.textSecondary },
  toggleTextActive: { color: '#000', fontWeight: '800' },
  input: { backgroundColor: CColors.surface, borderRadius: 12, padding: 14, color: CColors.text, fontSize: 15, borderWidth: 1, borderColor: CColors.border },
  error: { fontSize: 13, color: CColors.error, textAlign: 'center' },
  submitBtn: { backgroundColor: CColors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  submitText: { fontSize: 15, fontWeight: '900', color: '#000' },
  cancel: { fontSize: 13, color: CColors.textSecondary, textAlign: 'center', marginTop: 6, fontWeight: '600' },
});
