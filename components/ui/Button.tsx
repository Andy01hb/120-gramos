import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, loading, variant = 'primary', disabled, style }: Props) {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, isPrimary ? styles.primary : styles.ghost, (disabled || loading) && styles.disabled, style]}
    >
      {loading
        ? <ActivityIndicator color={isPrimary ? '#000' : Colors.primary} />
        : <Text style={[styles.label, !isPrimary && styles.labelGhost]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: Colors.primary },
  ghost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  disabled: { opacity: 0.5 },
  label: { fontSize: 15, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
  labelGhost: { color: Colors.primary },
});
