import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { createUser } from '../../lib/firestore';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
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

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || password.length < 6) {
      Alert.alert('Error', 'Completa todos los campos. La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    let firebaseUser: import('firebase/auth').User | null = null;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      firebaseUser = cred.user;

      // Push token is non-fatal — getPushToken() swallows its own errors
      const pushToken = await getPushToken();

      await createUser(firebaseUser.uid, {
        name: name.trim(),
        email: email.trim(),
        role: 'customer',
        pushToken,
      });
      // AuthContext detects login and redirects to /(customer)
    } catch (e: any) {
      // If Firestore write failed after auth account was created, clean up the orphan
      if (firebaseUser) {
        try { await firebaseUser.delete(); } catch {}
      }
      Alert.alert('Error', e.message ?? 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.title}>Crear cuenta</Text>
        <TextInput style={styles.input} placeholder="Tu nombre" placeholderTextColor={Colors.textSecondary} value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor={Colors.textSecondary} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Contraseña (mín. 6 caracteres)" placeholderTextColor={Colors.textSecondary} value={password} onChangeText={setPassword} secureTextEntry />
        <Button label="Crear cuenta" onPress={handleRegister} loading={loading} style={{ marginTop: 8 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: 24, gap: 12, justifyContent: 'center', flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.primary, marginBottom: 16 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.border,
  },
});
