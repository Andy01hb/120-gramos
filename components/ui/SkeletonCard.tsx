import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { CColors } from '../../constants/colors';

export function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.img} />
      <View style={styles.body}>
        <View style={styles.lineLong} />
        <View style={styles.lineRow}>
          <View style={styles.lineShort} />
          <View style={styles.circle} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CColors.surface, borderRadius: 16,
    overflow: 'hidden', width: '100%' as any,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  img: { width: '100%' as any, aspectRatio: 1.1, backgroundColor: CColors.surfaceMuted, minHeight: 110 },
  body: { padding: 10, gap: 10 },
  lineLong: { height: 12, borderRadius: 6, backgroundColor: CColors.border, width: '75%' as any },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineShort: { height: 14, borderRadius: 6, backgroundColor: CColors.border, width: '35%' as any },
  circle: { width: 26, height: 26, borderRadius: 13, backgroundColor: CColors.border },
});
