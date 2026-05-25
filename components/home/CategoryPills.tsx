import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import type { MenuCategory } from '../../types';

const CATEGORIES: { label: string; value: MenuCategory | 'all' }[] = [
  { label: 'Todo', value: 'all' },
  { label: 'Iced Coffee', value: 'iced_coffee' },
  { label: 'Matcha', value: 'matcha' },
  { label: 'Otras', value: 'otras' },
];

interface Props { active: MenuCategory | 'all'; onChange: (c: MenuCategory | 'all') => void }

export function CategoryPills({ active, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {CATEGORIES.map(c => (
        <TouchableOpacity
          key={c.value}
          style={[styles.pill, active === c.value && styles.pillActive]}
          onPress={() => onChange(c.value)}
        >
          <Text style={[styles.label, active === c.value && styles.labelActive]}>{c.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  pill: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  labelActive: { color: '#000' },
});
