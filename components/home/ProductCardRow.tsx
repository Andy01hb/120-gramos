import { ScrollView, TouchableOpacity, View, Image, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { CColors } from '../../constants/colors';
import type { MenuItem } from '../../types';

type Variant = 'dark' | 'warm';

interface Props {
  items: MenuItem[];
  variant?: Variant;
  cols?: number;
  alwaysScroll?: boolean;
}

const WARM = {
  card: '#FFFBF0',
  text: '#1C0800',
  textSub: '#7C4A00',
  price: '#C8960A',
  addBtn: '#C8960A',
  placeholder: '#FFF0D6',
};

function ProductCard({ item, variant = 'dark' }: { item: MenuItem; variant?: Variant }) {
  const router = useRouter();
  const isWarm = variant === 'warm';

  return (
    <TouchableOpacity
      style={[styles.card, isWarm && styles.cardWarm]}
      onPress={() => router.push(`/(customer)/menu/${item.id}`)}
      activeOpacity={0.85}
    >
      {item.imageUrl
        ? <Image
            source={{ uri: item.imageUrl }}
            style={[styles.img, isWarm && styles.imgWarm]}
            resizeMode="contain"
          />
        : (
          <View style={[styles.img, styles.placeholder, isWarm && styles.placeholderWarm]}>
            <Text style={styles.placeholderIcon}>☕</Text>
          </View>
        )
      }
      <View style={styles.body}>
        <Text
          style={[styles.name, isWarm && styles.nameWarm]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <View style={styles.bottom}>
          <Text style={styles.price}>${item.price}</Text>
          <View style={styles.addBtn}>
            <Text style={styles.plus}>+</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ProductCardRow({ items, variant = 'dark', cols: colsOverride, alwaysScroll }: Props) {
  const { width } = useWindowDimensions();

  if (width > 600 && !alwaysScroll) {
    const autoCols = width > 1100 ? 5 : width > 800 ? 4 : 3;
    const cols = colsOverride ?? autoCols;
    return (
      <View style={[styles.grid, { paddingHorizontal: 16 }]}>
        {items.map(item => (
          <View key={item.id} style={{ width: `${100 / cols}%` as any, padding: 6 }}>
            <ProductCard item={item} variant={variant} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, variant === 'warm' && styles.rowWarm]}
    >
      {items.map(item => (
        <View key={item.id} style={styles.mobileWrap}>
          <ProductCard item={item} variant={variant} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  rowWarm: { paddingHorizontal: 16, paddingBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  mobileWrap: { width: 148 },

  card: {
    backgroundColor: CColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%' as any,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardWarm: {
    backgroundColor: WARM.card,
    shadowOpacity: 0.1,
  },
  img: {
    width: '100%' as any,
    height: 140,
    backgroundColor: CColors.surface,
  },
  imgWarm: {
    backgroundColor: WARM.card,
  },
  placeholder: {
    backgroundColor: CColors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
  },
  placeholderWarm: {
    backgroundColor: WARM.placeholder,
  },
  placeholderIcon: { fontSize: 32 },
  body: { padding: 10, gap: 6 },
  name: { fontSize: 12, fontWeight: '800', color: CColors.text, lineHeight: 16, height: 32 },
  nameWarm: { color: WARM.text },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  price: { fontSize: 14, fontWeight: '900', color: CColors.primary },
  addBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: CColors.primary, alignItems: 'center', justifyContent: 'center',
  },
  plus: { fontSize: 18, fontWeight: '900', color: '#fff', lineHeight: 22 },
});
