import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import { useStand } from '../../contexts/StandContext';
import { updateStandSettings } from '../../lib/firestore';
import { defaultSchedule, DAY_NAMES_ES } from '../../lib/standHours';
import { Colors } from '../../constants/colors';
import type { DaySchedule } from '../../types';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
// Display Monday→Sunday, but store by JS getDay index (0 = Sunday)
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function StandHoursEditor() {
  const { settings } = useStand();

  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule());
  const [forceClosed, setForceClosed] = useState(false);
  const [location, setLocation] = useState('');
  const [closedMessage, setClosedMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Hydrate once from Firestore settings
  useEffect(() => {
    if (hydrated || !settings) return;
    setMode(settings.mode ?? 'manual');
    setSchedule(settings.schedule?.length === 7 ? settings.schedule : defaultSchedule());
    setForceClosed(!!settings.forceClosed);
    setLocation(settings.location ?? '');
    setClosedMessage(settings.closedMessage ?? '');
    setHydrated(true);
  }, [settings, hydrated]);

  function setDay(i: number, patch: Partial<DaySchedule>) {
    setSchedule(s => s.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
    setMsg(null);
  }

  async function save() {
    if (mode === 'auto') {
      for (let i = 0; i < 7; i++) {
        const d = schedule[i];
        if (d.closed) continue;
        if (!HHMM.test(d.open) || !HHMM.test(d.close)) {
          setMsg({ type: 'err', text: `Revisa la hora de ${DAY_NAMES_ES[i]} (formato 24h, ej. 16:00).` });
          return;
        }
        if (d.open >= d.close) {
          setMsg({ type: 'err', text: `En ${DAY_NAMES_ES[i]} la apertura debe ser antes del cierre.` });
          return;
        }
      }
    }
    setSaving(true);
    setMsg(null);
    try {
      await updateStandSettings({
        mode,
        schedule,
        forceClosed,
        location: location.trim(),
        closedMessage: closedMessage.trim(),
      });
      setMsg({ type: 'ok', text: '✅ Horario y datos guardados.' });
    } catch {
      setMsg({ type: 'err', text: 'No se pudo guardar. Intenta de nuevo.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.h2}>Horario y local</Text>

      {/* Mode */}
      <Text style={styles.label}>Control de apertura</Text>
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'manual' && styles.modeActive]}
          onPress={() => { setMode('manual'); setMsg(null); }}>
          <Text style={[styles.modeText, mode === 'manual' && styles.modeTextActive]}>✋ Manual</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'auto' && styles.modeActive]}
          onPress={() => { setMode('auto'); setMsg(null); }}>
          <Text style={[styles.modeText, mode === 'auto' && styles.modeTextActive]}>🕒 Automático</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>
        {mode === 'manual'
          ? 'Tú abres y cierras el stand con el botón de arriba. El horario de abajo solo se muestra a los clientes como referencia.'
          : 'El stand abre y cierra solo según este horario (hora de Río Bravo). Usa "Forzar cerrado" para excepciones.'}
      </Text>

      {/* Force closed (auto only) */}
      {mode === 'auto' && (
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Forzar cerrado hoy (festivo/excepción)</Text>
          <Switch
            value={forceClosed}
            onValueChange={(v) => { setForceClosed(v); setMsg(null); }}
            trackColor={{ true: Colors.error, false: Colors.border }}
            thumbColor="#fff"
          />
        </View>
      )}

      {/* Weekly schedule */}
      <Text style={[styles.label, { marginTop: 8 }]}>Horario semanal</Text>
      {DISPLAY_ORDER.map((di) => {
        const d = schedule[di];
        return (
          <View key={di} style={styles.dayRow}>
            <Text style={styles.dayName}>{DAY_NAMES_ES[di]}</Text>
            {d.closed ? (
              <Text style={styles.closedTag}>Cerrado</Text>
            ) : (
              <View style={styles.timesRow}>
                <TextInput
                  style={styles.timeInput}
                  value={d.open}
                  onChangeText={(t) => setDay(di, { open: t })}
                  placeholder="16:00"
                  placeholderTextColor={Colors.textSecondary}
                  maxLength={5}
                />
                <Text style={styles.timeDash}>–</Text>
                <TextInput
                  style={styles.timeInput}
                  value={d.close}
                  onChangeText={(t) => setDay(di, { close: t })}
                  placeholder="22:00"
                  placeholderTextColor={Colors.textSecondary}
                  maxLength={5}
                />
              </View>
            )}
            <TouchableOpacity
              style={styles.toggleClosed}
              onPress={() => setDay(di, { closed: !d.closed })}>
              <Text style={styles.toggleClosedText}>{d.closed ? 'Abrir' : 'Cerrar'}</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {/* Location */}
      <Text style={[styles.label, { marginTop: 12 }]}>Ubicación del stand</Text>
      <TextInput
        style={styles.textInput}
        value={location}
        onChangeText={(t) => { setLocation(t); setMsg(null); }}
        placeholder="Ej: Plaza de los Enamorados · Río Bravo"
        placeholderTextColor={Colors.textSecondary}
      />

      {/* Closed message */}
      <Text style={[styles.label, { marginTop: 12 }]}>Mensaje cuando está cerrado</Text>
      <TextInput
        style={[styles.textInput, { minHeight: 60, textAlignVertical: 'top' }]}
        value={closedMessage}
        onChangeText={(t) => { setClosedMessage(t); setMsg(null); }}
        placeholder="Ej: Volvemos el próximo fin de semana."
        placeholderTextColor={Colors.textSecondary}
        multiline
        maxLength={140}
      />

      {msg && (
        <Text style={[styles.msg, msg.type === 'ok' ? styles.msgOk : styles.msgErr]}>{msg.text}</Text>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveText}>Guardar horario y datos</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  h2: { fontSize: 18, fontWeight: '900', color: Colors.primary },
  label: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  hint: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },

  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surfaceAlt,
  },
  modeActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modeText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  modeTextActive: { color: '#000', fontWeight: '900' },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 4 },
  switchLabel: { flex: 1, fontSize: 13, color: Colors.text, fontWeight: '600' },

  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayName: { width: 84, fontSize: 13, fontWeight: '700', color: Colors.text },
  timesRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeInput: {
    width: 64, backgroundColor: Colors.surfaceAlt, borderRadius: 8, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 8, paddingVertical: 7, color: Colors.text, fontSize: 14, textAlign: 'center',
  },
  timeDash: { color: Colors.textSecondary, fontSize: 14 },
  closedTag: { flex: 1, fontSize: 13, color: Colors.error, fontWeight: '700' },
  toggleClosed: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  toggleClosedText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },

  textInput: {
    backgroundColor: Colors.surfaceAlt, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 10, color: Colors.text, fontSize: 14,
  },

  msg: { fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  msgOk: { color: Colors.success },
  msgErr: { color: Colors.error },

  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  saveText: { fontSize: 15, fontWeight: '900', color: '#000' },
});
