import { TouchableOpacity, View, Image, Text, StyleSheet } from 'react-native';
import { CColors } from '../../constants/colors';
import type { MenuItem } from '../../types';

interface Props { item: MenuItem; onPress: () => void }

function PlaceholderImage() {
  return (
    <View style={[styles.img, styles.imgPlaceholder]}>
      <Text style={styles.placeholderIcon}>☕</Text>
    </View>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

export function ProductListItem({ item, onPress }: Props) {
  const personalizable = item.options && item.options.length > 0;

  return (
    <TouchableOpacity
      style={[styles.card, !item.available && styles.unavailable]}
      onPress={onPress}
      disabled={!item.available}
      activeOpacity={0.8}
    >
      <View style={styles.accentBar} />

      {item.imageUrl
        ? <Image source={{ uri: item.imageUrl }} style={styles.img} resizeMode="cover" />
        : <PlaceholderImage />
      }

      <View style={styles.info}>
        {item.isFeatured && <Badge text="⭐ Best Seller" />}
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        {!item.available ? (
          <Text style={styles.unavailText}>No disponible hoy</Text>
        ) : personalizable ? (
          <Text style={styles.tags}>Personalizable</Text>
        ) : null}
      </View>

      <View style={styles.right}>
        <Text style={[styles.price, !item.available && styles.priceUnavail]}>${item.price}</Text>
        {item.available && (
          <View style={styles.addBtn}>
            <Text style={styles.addText}>+</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CColors.surface, borderRadius: 14,
    overflow: 'hidden', minHeight: 84,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  unavailable: { opacity: 0.45 },
  accentBar: { width: 4, alignSelf: 'stretch', backgroundColor: CColors.primary },
  img: { width: 80, height: 80 },
  imgPlaceholder: {
    backgroundColor: CColors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  placeholderIcon: { fontSize: 28 },
  info: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, gap: 3 },
  badge: {
    alignSelf: 'flex-start', backgroundColor: CColors.surfaceWarm,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 2,
    borderWidth: 1, borderColor: CColors.border,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: CColors.primary, letterSpacing: 0.5 },
  name: { fontSize: 14, fontWeight: '800', color: CColors.text, lineHeight: 18 },
  tags: { fontSize: 11, color: CColors.textSecondary, fontWeight: '500' },
  unavailText: { fontSize: 11, color: CColors.error, fontWeight: '600' },
  right: { paddingHorizontal: 14, alignItems: 'center', gap: 8 },
  price: { fontSize: 15, fontWeight: '900', color: CColors.primary },
  priceUnavail: { color: CColors.border },
  addBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: CColors.primary, alignItems: 'center', justifyContent: 'center',
  },
  addText: { fontSize: 20, fontWeight: '900', color: '#fff', lineHeight: 24 },
});
