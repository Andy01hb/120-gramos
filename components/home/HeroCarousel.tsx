import { useEffect, useRef, useState } from 'react';
import { View, Image, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

const SLIDES = [
  { id: '1', title: 'Iced Coffee\nLatte', tag: 'Destacado', image: require('../../assets/hero1.jpg') },
  { id: '2', title: 'Matcha\nLatte', tag: 'Recomendado', image: require('../../assets/hero2.jpg') },
  { id: '3', title: 'Taro\nLatte', tag: 'Nuevo', image: require('../../assets/hero3.jpg') },
];

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const ref = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (active + 1) % SLIDES.length;
      ref.current?.scrollToIndex({ index: next, animated: true });
      setActive(next);
    }, 4000);
    return () => clearInterval(timer);
  }, [active]);

  return (
    <View>
      <FlatList
        ref={ref}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i.id}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setActive(idx);
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.slide}
            onPress={() => router.push('/(customer)/menu')}
          >
            <Image source={item.image} style={styles.image} resizeMode="cover" />
            <View style={styles.overlay}>
              <Text style={styles.tag}>{item.tag}</Text>
              <Text style={styles.title}>{item.title}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === active && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { width, height: 200, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end', padding: 16,
  },
  tag: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: Colors.primary, textTransform: 'uppercase' },
  title: { fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 26 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 10 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { width: 14, backgroundColor: Colors.primary },
});
