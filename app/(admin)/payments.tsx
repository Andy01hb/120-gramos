import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, app } from '../../lib/firebase';
import { Colors } from '../../constants/colors';

const WEBHOOK_URL = 'https://us-central1-gramos-app.cloudfunctions.net/stripeWebhook';

interface StripeStatus {
  configured?: boolean;
  mode?: 'test' | 'live';
  publishableKey?: string;
  secretKeyLast4?: string;
  webhookConfigured?: boolean;
}

export default function PaymentsScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<StripeStatus | null>(null);

  const [mode, setMode] = useState<'test' | 'live'>('test');
  const [pk, setPk] = useState('');
  const [sk, setSk] = useState('');
  const [whsec, setWhsec] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'stripe'), (snap) => {
      const d = (snap.data() as StripeStatus) ?? null;
      setStatus(d);
      if (d?.mode) setMode(d.mode);
      if (d?.publishableKey) setPk(d.publishableKey);
    });
  }, []);

  async function save() {
    setMsg(null);
    if (!pk.trim()) { setMsg({ type: 'err', text: 'Falta la clave publishable (pk_...).' }); return; }
    setSaving(true);
    try {
      const fns = getFunctions(app, 'us-central1');
      const setStripeConfig = httpsCallable(fns, 'setStripeConfig');
      const res: any = await setStripeConfig({
        publishableKey: pk.trim(),
        secretKey: sk.trim() || undefined,
        webhookSecret: whsec.trim() || undefined,
        mode,
      });
      setSk(''); setWhsec(''); // never keep secrets in the form
      setMsg({ type: 'ok', text: `✅ Guardado en modo ${res.data.mode === 'live' ? 'PRODUCCIÓN' : 'PRUEBA'}.` });
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.message ?? 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={Platform.OS === 'web' ? [] : ['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Volver</Text></TouchableOpacity>
        <Text style={styles.title}>Pagos (Stripe)</Text>
        <Text style={styles.sub}>Conecta tu cuenta de Stripe para cobrar con tarjeta en la app y la web.</Text>

        {/* Status */}
        <View style={styles.statusCard}>
          {status?.configured ? (
            <>
              <Text style={styles.statusOk}>● Configurado · modo {status.mode === 'live' ? 'PRODUCCIÓN' : 'PRUEBA'}</Text>
              {status.publishableKey ? <Text style={styles.statusLine}>Publishable: {mask(status.publishableKey)}</Text> : null}
              {status.secretKeyLast4 ? <Text style={styles.statusLine}>Clave secreta: sk_••••{status.secretKeyLast4}</Text> : null}
              <Text style={styles.statusLine}>Webhook: {status.webhookConfigured ? '✓ configurado' : '✗ falta'}</Text>
            </>
          ) : (
            <Text style={styles.statusPending}>● Aún no configurado — usa el formulario de abajo.</Text>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.guide}>
          <Text style={styles.guideTitle}>📋 Cómo obtener tus datos en Stripe</Text>
          <Step n="1" t="Entra a dashboard.stripe.com e inicia sesión (o crea tu cuenta y activa tu negocio)." />
          <Step n="2" t="Arriba a la derecha, elige el modo: 'Modo de prueba' para probar, o desactívalo para cobros reales (producción)." />
          <Step n="3" t="Ve a Desarrolladores → Claves de API. Copia la 'Clave publicable' (pk_...) y la 'Clave secreta' (sk_...)." />
          <Step n="4" t="Ve a Desarrolladores → Webhooks → 'Agregar endpoint'. Pega esta URL:" />
          <View style={styles.urlBox}><Text selectable style={styles.urlText}>{WEBHOOK_URL}</Text></View>
          <Step n="5" t="En 'Eventos a escuchar' elige: payment_intent.succeeded. Guarda." />
          <Step n="6" t="Abre el webhook recién creado y copia su 'Secreto de firma' (whsec_...)." />
          <Step n="7" t="Pega los 3 datos abajo, elige el modo y toca 'Validar y guardar'." />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>MODO</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity style={[styles.modeBtn, mode === 'test' && styles.modeActive]} onPress={() => setMode('test')}>
              <Text style={[styles.modeText, mode === 'test' && styles.modeTextActive]}>🧪 Prueba</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modeBtn, mode === 'live' && styles.modeActive]} onPress={() => setMode('live')}>
              <Text style={[styles.modeText, mode === 'live' && styles.modeTextActive]}>💳 Producción</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>CLAVE PUBLICABLE (pk_…)</Text>
          <TextInput style={styles.input} value={pk} onChangeText={setPk} placeholder={mode === 'live' ? 'pk_live_…' : 'pk_test_…'} placeholderTextColor={Colors.textSecondary} autoCapitalize="none" />

          <Text style={styles.label}>CLAVE SECRETA (sk_…)</Text>
          <TextInput style={styles.input} value={sk} onChangeText={setSk} placeholder={status?.secretKeyLast4 ? `Guardada (••••${status.secretKeyLast4}) — escribe para cambiarla` : (mode === 'live' ? 'sk_live_…' : 'sk_test_…')} placeholderTextColor={Colors.textSecondary} autoCapitalize="none" secureTextEntry />

          <Text style={styles.label}>SECRETO DE FIRMA DEL WEBHOOK (whsec_…)</Text>
          <TextInput style={styles.input} value={whsec} onChangeText={setWhsec} placeholder={status?.webhookConfigured ? 'Guardado — escribe para cambiarlo' : 'whsec_…'} placeholderTextColor={Colors.textSecondary} autoCapitalize="none" secureTextEntry />

          <Text style={styles.hint}>🔒 Tus claves secretas se guardan cifradas en el servidor y nunca se vuelven a mostrar.</Text>

          {msg && <Text style={[styles.msg, msg.type === 'ok' ? styles.msgOk : styles.msgErr]}>{msg.text}</Text>}

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveText}>Validar y guardar</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Step({ n, t }: { n: string; t: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNum}><Text style={styles.stepNumText}>{n}</Text></View>
      <Text style={styles.stepText}>{t}</Text>
    </View>
  );
}

function mask(k: string): string {
  if (k.length <= 12) return k;
  return `${k.slice(0, 8)}…${k.slice(-4)}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center', paddingBottom: 40 },
  back: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '900', color: Colors.primary },
  sub: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },

  statusCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, gap: 4, borderWidth: 1, borderColor: Colors.border },
  statusOk: { fontSize: 14, fontWeight: '800', color: Colors.success },
  statusPending: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  statusLine: { fontSize: 12, color: Colors.textSecondary },

  guide: { backgroundColor: Colors.surfaceAlt, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: Colors.border },
  guideTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  step: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 12, fontWeight: '900', color: '#000' },
  stepText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 19 },
  urlBox: { backgroundColor: '#000', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: Colors.border },
  urlText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  form: { gap: 8 },
  label: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary, marginTop: 6, letterSpacing: 0.4 },
  input: { backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 11, color: Colors.text, fontSize: 14 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  modeActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modeText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  modeTextActive: { color: '#000', fontWeight: '900' },
  hint: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  msg: { fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  msgOk: { color: Colors.success },
  msgErr: { color: Colors.error },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  saveText: { fontSize: 16, fontWeight: '900', color: '#000' },
});
