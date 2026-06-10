import { useState } from 'react';
import { View, FlatList, StyleSheet, Text, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CategoryPills } from '../../../components/home/CategoryPills';
import { ProductListItem } from '../../../components/menu/ProductListItem';
import { SkeletonCard } from '../../../components/ui/SkeletonCard';
import { useMenu } from '../../../hooks/useMenu';
import { CColors } from '../../../constants/colors';
import type { MenuCategory } from '../../../types';

export default function MenuScreen() {
  const [category, setCategory] = useState<MenuCategory | 'all'>('all');
  const { items, loading } = useMenu(category === 'all' ? undefined : category);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const twoCol = isWeb && width > 800;

  return (
    <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
      <View style={[styles.inner, isWeb && { maxWidth: 1100, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Menú</Text>
          <Text style={styles.subtitle}>{loading ? '…' : `${items.length} bebidas`}</Text>
        </View>

        <CategoryPills active={category} onChange={setCategory} />

        {loading ? (
          <View style={[styles.skeletonGrid, twoCol && styles.skeletonGridTwo]}>
            {Array.from({ length: twoCol ? 6 : 5 }).map((_, i) => (
              <View key={i} style={twoCol ? styles.skeletonColItem : styles.skeletonItem}>
                <SkeletonCard />
              </View>
            ))}
          </View>
        ) : items.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>☕</Text>
            <Text style={styles.emptyTitle}>
              {category === 'all' ? 'El menú está vacío' : 'Sin bebidas en esta categoría'}
            </Text>
            <Text style={styles.emptyText}>Pronto habrá bebidas disponibles</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={i => i.id}
            numColumns={twoCol ? 2 : 1}
            key={twoCol ? 'two' : 'one'}
            renderItem={({ item }) => (
              <View style={twoCol ? styles.colItem : styles.singleItem}>
                <ProductListItem item={item} onPress={() => router.push(`/(customer)/menu/${item.id}`)} />
              </View>
            )}
            contentContainerStyle={styles.list}
            columnWrapperStyle={twoCol ? styles.row : undefined}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CColors.background },
  inner: { flex: 1 },
  header: {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4,
    flexDirection: 'row', alignItems: 'baseline', gap: 8,
  },
  title: { fontSize: 30, fontWeight: '900', color: CColors.primary },
  subtitle: { fontSize: 12, fontWeight: '600', color: CColors.textSecondary },
  list: { padding: 16, paddingTop: 8 },
  row: { gap: 10 },
  singleItem: { flex: 1 },
  colItem: { flex: 1 },
  skeletonGrid: { padding: 16, gap: 10 },
  skeletonGridTwo: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skeletonItem: {},
  skeletonColItem: { width: '48%' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: CColors.text, textAlign: 'center' },
  emptyText: { fontSize: 13, color: CColors.textSecondary, textAlign: 'center' },
});
