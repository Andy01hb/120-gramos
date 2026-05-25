import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Path } from 'react-native-svg';
import { HeroCarousel } from '../../components/home/HeroCarousel';
import { CategoryPills } from '../../components/home/CategoryPills';
import { ProductCardRow } from '../../components/home/ProductCardRow';
import { useStand } from '../../contexts/StandContext';
import { useMenu } from '../../hooks/useMenu';
import { Colors } from '../../constants/colors';
import type { MenuCategory } from '../../types';

export default function HomeScreen() {
  const { isOpen } = useStand();
  const [category, setCategory] = useState<MenuCategory | 'all'>('all');
  const { items } = useMenu(category === 'all' ? undefined : category);
  const featured = items.filter(i => i.isFeatured);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <View style={styles.location}>
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={Colors.primary} />
          </Svg>
          <Text style={styles.locationText}>Plaza de los Enamorados</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isOpen ? '#1a2a1a' : '#2a1a1a' }]}>
          <View style={[styles.statusDot, { backgroundColor: isOpen ? Colors.success : Colors.error }]} />
          <Text style={[styles.statusText, { color: isOpen ? Colors.success : Colors.error }]}>
            {isOpen ? 'Abierto' : 'Cerrado'}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <HeroCarousel />

        <View style={styles.section}>
          <CategoryPills active={category} onChange={setCategory} />
        </View>

        {featured.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Más vendidos</Text>
            <ProductCardRow items={featured} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explora el menú</Text>
          <ProductCardRow items={items} />
        </View>

        {/* Stand info card */}
        <View style={styles.standCard}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={Colors.primary} />
          </Svg>
          <View>
            <Text style={styles.standTitle}>Sáb y Dom · Desde 5:00 PM</Text>
            <Text style={styles.standSub}>Plaza de los Enamorados · Río Bravo, Tamps.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  scroll: { gap: 16, paddingBottom: 24 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: Colors.text, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 16 },
  standCard: { marginHorizontal: 16, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  standTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  standSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
});
