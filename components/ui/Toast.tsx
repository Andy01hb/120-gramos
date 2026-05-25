import { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '../../constants/colors';

type ToastProps = {
  message: string;
  visible: boolean;
  type?: 'error' | 'success' | 'info';
};

const TYPE_COLOR = {
  error: Colors.error,
  success: Colors.success,
  info: Colors.primary,
};

export function Toast({ message, visible, type = 'info' }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <Animated.View style={[styles.toast, { backgroundColor: TYPE_COLOR[type], opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 24,
    right: 24,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    zIndex: 999,
    elevation: 10,
  },
  text: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
