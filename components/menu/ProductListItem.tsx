import { TouchableOpacity, View, Image, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import type { MenuItem } from '../../types';

interface Props { item: MenuItem; onPress: () => void }

export function ProductListItem({ item, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.row, !item.available && styles.unavailable]}
      onPress={onPress}
      disabled={!item.available}
      activeOpacity={0.75}
    >
      <View style={styles.leftBorder} />
      {item.imageUrl
        ? <Image source={{ uri: item.imageUrl }} style={styles.img} resizeMode="cover" />
        : <View style={[styles.img, styles.imgPlaceholder]} />
      }
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.sub}>
          {!item.available ? 'No disponible hoy' : item.hasBoba ? '+ Boba disponible' : item.flavors.length > 0 ? item.flavors.join(', ') : 'Sin personalización'}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.price, !item.available && styles.priceUnavail]}>${item.price}</Text>
        {item.available && <View style={styles.addBtn}><Text style={styles.plus}>+</Text></View>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, overflow: 'hidden', gap: 0 },
  unavailable: { opacity: 0.45 },
  leftBorder: { width: 3, height: '100%', backgroundColor: Colors.primary, position: 'absolute', left: 0, top: 0, bottom: 0 },
  img: { width: 70, height: 70, marginLeft: 3 },
  imgPlaceholder: { backgroundColor: Colors.border },
  info: { flex: 1, paddingVertical: 10, paddingHorizontal: 10, gap: 3 },
  name: { fontSize: 13, fontWeight: '700', color: Colors.text },
  sub: { fontSize: 11, color: Colors.textSecondary },
  right: { paddingHorizontal: 10, alignItems: 'flex-end', gap: 6 },
  price: { fontSize: 14, fontWeight: '900', color: Colors.primary },
  priceUnavail: { color: Colors.border },
  addBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  plus: { fontSize: 18, fontWeight: '900', color: '#000', lineHeight: 22 },
});
