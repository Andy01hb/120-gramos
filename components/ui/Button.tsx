import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
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
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      android_ripple={{ color: isPrimary ? 'rgba(0,0,0,0.15)' : Colors.primary + '33' }}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.ghost,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={isPrimary ? '#000' : Colors.primary} />
        : <Text style={[styles.label, !isPrimary && styles.labelGhost]}>{label}</Text>
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: Colors.primary },
  ghost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
  label: { fontSize: 15, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
  labelGhost: { color: Colors.primary },
});
