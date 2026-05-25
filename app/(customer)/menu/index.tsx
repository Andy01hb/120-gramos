import { useState } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CategoryPills } from '../../../components/home/CategoryPills';
import { ProductListItem } from '../../../components/menu/ProductListItem';
import { useMenu } from '../../../hooks/useMenu';
import { Colors } from '../../../constants/colors';
import type { MenuCategory } from '../../../types';

export default function MenuScreen() {
  const [category, setCategory] = useState<MenuCategory | 'all'>('all');
  const { items, loading } = useMenu(category === 'all' ? undefined : category);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Menú</Text>
      </View>
      <CategoryPills active={category} onChange={setCategory} />
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <ProductListItem item={item} onPress={() => router.push(`/(customer)/menu/${item.id}`)} />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.primary },
  list: { padding: 16, paddingTop: 10 },
});
