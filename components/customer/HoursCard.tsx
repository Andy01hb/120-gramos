import { View, Text, StyleSheet } from 'react-native';
import { useStand } from '../../contexts/StandContext';
import { DAY_NAMES_ES, getStandDayIndex } from '../../lib/standHours';
import { CColors } from '../../constants/colors';

const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Lunes → Domingo

/** Customer-facing weekly schedule. Renders nothing if no schedule is configured. */
export function HoursCard() {
  const { settings } = useStand();
  const schedule = settings?.schedule;
  if (!schedule || schedule.length !== 7) return null;

  const today = getStandDayIndex();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🕒 Horario</Text>
      {DISPLAY_ORDER.map((di) => {
        const d = schedule[di];
        const isToday = di === today;
        return (
          <View key={di} style={styles.row}>
            <Text style={[styles.day, isToday && styles.todayText]}>
              {DAY_NAMES_ES[di]}{isToday ? ' (hoy)' : ''}
            </Text>
            <Text style={[styles.hours, isToday && styles.todayText, d.closed && styles.closed]}>
              {d.closed ? 'Cerrado' : `${d.open} – ${d.close}`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CColors.surface, borderRadius: 16, padding: 16, gap: 8,
    borderWidth: 1, borderColor: CColors.border,
  },
  title: { fontSize: 14, fontWeight: '900', color: CColors.primary, marginBottom: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  day: { fontSize: 13, color: CColors.textSecondary, fontWeight: '600' },
  hours: { fontSize: 13, color: CColors.text, fontWeight: '700' },
  closed: { color: CColors.textSecondary, fontWeight: '600' },
  todayText: { color: CColors.primary },
});
