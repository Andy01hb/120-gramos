import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { CColors } from '../../constants/colors';
import { useCategories } from '../../hooks/useCategories';

interface Props { active: string; onChange: (c: string) => void }

export function CategoryPills({ active, onChange }: Props) {
  const categories = useCategories();
  const pills = [{ label: 'Todo', value: 'all' }, ...categories.map(c => ({ label: c, value: c }))];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {pills.map(c => (
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
  scroll: { flexGrow: 0, flexShrink: 0, backgroundColor: CColors.background },
  row: { paddingHorizontal: 16, gap: 8, paddingVertical: 12, alignItems: 'center' },
  pill: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 100,
    borderWidth: 1.5, borderColor: CColors.border,
    backgroundColor: CColors.surface,
  },
  pillActive: { backgroundColor: CColors.primary, borderColor: CColors.primary },
  label: { fontSize: 12, fontWeight: '800', color: CColors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  labelActive: { color: '#fff' },
});
