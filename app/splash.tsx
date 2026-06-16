import { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/colors';

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const steam1 = useSharedValue(0);
  const steam2 = useSharedValue(0);
  const steam3 = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  const s1Style = useAnimatedStyle(() => ({ opacity: steam1.value, transform: [{ translateY: -steam1.value * 8 }] }));
  const s2Style = useAnimatedStyle(() => ({ opacity: steam2.value, transform: [{ translateY: -steam2.value * 10 }] }));
  const s3Style = useAnimatedStyle(() => ({ opacity: steam3.value, transform: [{ translateY: -steam3.value * 7 }] }));

  function navigate() {
    if (loading) return;
    if (!user) router.replace('/(customer)'); // guests browse without logging in
    else if (user.role === 'admin') router.replace('/(admin)/orders');
    else router.replace('/(customer)');
  }

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 600 });

    const loop = withRepeat(withSequence(withTiming(1, { duration: 800 }), withTiming(0, { duration: 800 })), -1);
    steam1.value = withDelay(200, loop);
    steam2.value = withDelay(500, loop);
    steam3.value = withDelay(350, loop);

    const timer = setTimeout(() => runOnJS(navigate)(), 2200);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <View style={styles.container}>
      <View style={styles.steamRow}>
        <Animated.View style={[styles.steam, s1Style]} />
        <Animated.View style={[styles.steam, s2Style]} />
        <Animated.View style={[styles.steam, s3Style]} />
      </View>
      <Animated.View style={logoStyle}>
        <Image
          source={require('../assets/logo.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.Text style={[styles.tagline, { opacity }]}>
        CAFE DE ALTURA
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  steamRow: { flexDirection: 'row', gap: 8, marginBottom: 4, height: 20, alignItems: 'flex-end' },
  steam: { width: 3, height: 16, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.25)' },
  logo: { width: 180, height: 180 },
  tagline: { marginTop: 12, fontSize: 11, fontWeight: '700', letterSpacing: 6, color: 'rgba(0,0,0,0.45)' },
});
