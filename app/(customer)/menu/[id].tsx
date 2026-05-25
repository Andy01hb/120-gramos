import { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useCart } from '../../../contexts/CartContext';
import { useStand } from '../../../contexts/StandContext';
import { Button } from '../../../components/ui/Button';
import { Colors } from '../../../constants/colors';
import type { MenuItem } from '../../../types';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const { isOpen } = useStand();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedFlavor, setSelectedFlavor] = useState<string | null>(null);
  const [addBoba, setAddBoba] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'menu', id)).then(snap => {
      if (snap.exists()) setItem({ id: snap.id, ...snap.data() } as MenuItem);
    });
  }, [id]);

  if (!item) return null;

  const total = (item.price + (addBoba ? 15 : 0)) * quantity;

  function handleAdd() {
    if (!isOpen) { Alert.alert('Stand cerrado', 'Volvemos el próximo fin de semana.'); return; }
    addItem({
      productId: item!.id,
      name: item!.name,
      quantity,
      flavors: selectedFlavor ? [selectedFlavor] : [],
      addBoba,
      unitPrice: item!.price + (addBoba ? 15 : 0),
    });
    router.push('/(customer)/cart');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView>
        {item.imageUrl
          ? <Image source={{ uri: item.imageUrl }} style={styles.img} resizeMode="cover" />
          : <View style={[styles.img, { backgroundColor: Colors.surface }]} />
        }
        <View style={styles.body}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.price}>${item.price} MXN</Text>

          {/* Flavors */}
          {item.flavors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Sabor (jarabe Torani)</Text>
              <View style={styles.options}>
                {item.flavors.map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.option, selectedFlavor === f && styles.optionActive]}
                    onPress={() => setSelectedFlavor(f === selectedFlavor ? null : f)}
                  >
                    <Text style={[styles.optionText, selectedFlavor === f && styles.optionTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Boba toggle */}
          {item.hasBoba && (
            <TouchableOpacity
              style={[styles.bobaToggle, addBoba && styles.bobaActive]}
              onPress={() => setAddBoba(b => !b)}
            >
              <Text style={[styles.bobaText, addBoba && styles.bobaTextActive]}>
                {addBoba ? '✓ ' : ''}Agregar Boba +$15
              </Text>
            </TouchableOpacity>
          )}

          {/* Quantity stepper */}
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => Math.max(1, q - 1))}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qty}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => q + 1)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          <Button
            label={`Agregar al carrito · $${total}`}
            onPress={handleAdd}
            disabled={!isOpen}
          />
          {!isOpen && <Text style={styles.closedNote}>El stand está cerrado. Volvemos el próximo fin de semana.</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  img: { width: '100%', height: 260 },
  body: { padding: 20, gap: 16 },
  name: { fontSize: 26, fontWeight: '900', color: Colors.text },
  price: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  section: { gap: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border },
  optionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  optionTextActive: { color: '#000', fontWeight: '700' },
  bobaToggle: { padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  bobaActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  bobaText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  bobaTextActive: { color: '#000' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  qtyBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 24, color: Colors.text, fontWeight: '300' },
  qty: { fontSize: 22, fontWeight: '900', color: Colors.text, minWidth: 32, textAlign: 'center' },
  closedNote: { fontSize: 12, color: Colors.error, textAlign: 'center' },
});
