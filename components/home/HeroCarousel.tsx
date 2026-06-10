import { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, FlatList, Animated } from 'react-native';
import { CColors } from '../../constants/colors';

interface Props {
  imageUrls: string[];
  loading?: boolean;
}

function HeroSkeleton() {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return <Animated.View style={[styles.skeleton, { opacity }]} />;
}

export function HeroCarousel({ imageUrls, loading }: Props) {
  const [active, setActive] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const ref = useRef<FlatList>(null);

  useEffect(() => {
    if (containerWidth === 0 || imageUrls.length < 2) return;
    const timer = setInterval(() => {
      const next = (active + 1) % imageUrls.length;
      ref.current?.scrollToIndex({ index: next, animated: true });
      setActive(next);
    }, 4000);
    return () => clearInterval(timer);
  }, [active, containerWidth, imageUrls.length]);

  if (containerWidth === 0 || loading || imageUrls.length === 0) {
    return (
      <View
        style={styles.wrapper}
        onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
      >
        <View style={styles.placeholder}>
          {containerWidth > 0 && <HeroSkeleton />}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper} onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}>
      <FlatList
        ref={ref}
        data={imageUrls}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        getItemLayout={(_, index) => ({ length: containerWidth, offset: containerWidth * index, index })}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / containerWidth);
          setActive(idx);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: containerWidth }]}>
            <Image source={{ uri: item }} style={styles.image} resizeMode="cover" />
          </View>
        )}
      />

      {imageUrls.length > 1 && (
        <View style={styles.dots} pointerEvents="none">
          {imageUrls.map((_, i) => (
            <View key={i} style={[styles.dot, i === active && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: CColors.surface,
  },
  placeholder: {
    height: 200,
    backgroundColor: CColors.surface,
  },
  skeleton: {
    flex: 1,
    backgroundColor: CColors.surfaceAlt,
  },
  slide: { height: 200, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  dots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { width: 16, backgroundColor: CColors.primary },
});
