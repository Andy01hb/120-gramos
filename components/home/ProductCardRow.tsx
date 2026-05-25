import { ScrollView, TouchableOpacity, View, Image, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import type { MenuItem } from '../../types';

interface Props { items: MenuItem[] }

export function ProductCardRow({ items }: Props) {
  const router = useRouter();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map(item => (
        <TouchableOpacity
          key={item.id}
          style={styles.card}
          onPress={() => router.push(`/(customer)/menu/${item.id}`)}
        >
          {item.imageUrl
            ? <Image source={{ uri: item.imageUrl }} style={styles.img} resizeMode="cover" />
            : <View style={[styles.img, styles.placeholder]} />
          }
          <View style={styles.body}>
            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
            <View style={styles.bottom}>
              <Text style={styles.price}>${item.price}</Text>
              <View style={styles.addBtn}><Text style={styles.plus}>+</Text></View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  card: { width: 130, backgroundColor: Colors.surface, borderRadius: 14, overflow: 'hidden' },
  img: { width: 130, height: 100 },
  placeholder: { backgroundColor: Colors.border },
  body: { padding: 8, gap: 6 },
  name: { fontSize: 11, fontWeight: '700', color: Colors.text, lineHeight: 15 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 13, fontWeight: '900', color: Colors.primary },
  addBtn: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  plus: { fontSize: 16, fontWeight: '900', color: '#000', lineHeight: 20 },
});
