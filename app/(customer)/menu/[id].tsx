import { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useCart } from '../../../contexts/CartContext';
import { useStand } from '../../../contexts/StandContext';
import { Button } from '../../../components/ui/Button';
import { CColors } from '../../../constants/colors';
import { DEFAULT_CLOSED_MESSAGE } from '../../../lib/standHours';
import type { MenuItem, ProductOption, OptionSelection } from '../../../types';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const { isOpen, settings } = useStand();
  const closedMsg = settings?.closedMessage || DEFAULT_CLOSED_MESSAGE;
  const [item, setItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<string, OptionSelection>>({});

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const wideLayout = isWeb && width > 760;

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, 'menu', id), snap => {
      if (snap.exists()) setItem({ id: snap.id, options: [], ...snap.data() } as MenuItem);
    });
  }, [id]);

  if (!item) return null;

  function selectOption(opt: ProductOption, answer: string) {
    const extraPrice = opt.type === 'boolean' && answer === 'Sí' ? opt.extraPrice :
                       opt.type === 'single' ? opt.extraPrice : 0;
    setSelections(prev => ({
      ...prev,
      [opt.id]: { optionId: opt.id, question: opt.question, answer, extraPrice },
    }));
  }

  function getMissingRequired(): string | null {
    for (const opt of item!.options) {
      if (opt.required && !selections[opt.id]) return opt.question;
    }
    return null;
  }

  const selectionsTotal = Object.values(selections).reduce((s, sel) => s + sel.extraPrice, 0);
  const total = (item.price + selectionsTotal) * quantity;

  function handleAdd() {
    if (!isOpen) { Alert.alert('Stand cerrado', closedMsg); return; }
    const missing = getMissingRequired();
    if (missing) { Alert.alert('Falta una opción', `Por favor selecciona: ${missing}`); return; }

    addItem({
      productId: item!.id,
      name: item!.name,
      quantity,
      unitPrice: item!.price + selectionsTotal,
      selections: Object.values(selections),
    });
    router.navigate('/(customer)/orders' as any);
  }

  const detailContent = (
    <View style={[styles.body, wideLayout && styles.bodyWide]}>
      <Text style={styles.name}>{item.name}</Text>
      {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
      <Text style={styles.price}>${item.price} MXN</Text>

      {item.options.length > 0 && (
        <View style={styles.optionsBlock}>
          {item.options.map(opt => (
            <View key={opt.id} style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionLabel}>
                  {opt.question}{opt.required ? <Text style={styles.required}> *</Text> : null}
                </Text>
                {opt.extraPrice > 0 && <Text style={styles.extraPrice}>+${opt.extraPrice}</Text>}
              </View>
              <View style={styles.options}>
                {(opt.type === 'single' ? opt.choices : ['Sí', 'No']).map(choice => {
                  const isSelected = selections[opt.id]?.answer === choice;
                  return (
                    <TouchableOpacity
                      key={choice}
                      style={[styles.option, isSelected && styles.optionActive]}
                      onPress={() => selectOption(opt, choice)}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                        {isSelected ? '✓ ' : ''}{choice}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.qtyRow}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => Math.max(1, q - 1))}>
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qty}>{quantity}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => Math.min(10, q + 1))}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <Button
        label={`Agregar al carrito · $${total}`}
        onPress={handleAdd}
        disabled={!isOpen}
      />
      {!isOpen && <Text style={styles.closedNote}>{closedMsg}</Text>}
    </View>
  );

  if (wideLayout) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <ScrollView contentContainerStyle={styles.wideContainer}>
          <View style={styles.wideInner}>
            <View style={styles.wideImageCol}>
              {item.imageUrl
                ? <Image source={{ uri: item.imageUrl }} style={styles.imgWide} resizeMode="contain" />
                : <View style={[styles.imgWide, { backgroundColor: CColors.surfaceMuted }]} />
              }
            </View>
            <View style={styles.wideDetailCol}>{detailContent}</View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView>
        {item.imageUrl
          ? <Image source={{ uri: item.imageUrl }} style={styles.img} resizeMode="contain" />
          : <View style={[styles.img, { backgroundColor: CColors.surfaceMuted }]} />
        }
        {detailContent}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CColors.background },
  img: { width: '100%', height: 280, backgroundColor: CColors.surface },
  body: { padding: 20, gap: 16, backgroundColor: CColors.background },
  bodyWide: { padding: 32, paddingTop: 20 },
  wideContainer: { flexGrow: 1, padding: 40, backgroundColor: CColors.background },
  wideInner: { flexDirection: 'row', gap: 40, maxWidth: 960, alignSelf: 'center', width: '100%' },
  wideImageCol: { flex: 1, borderRadius: 20, overflow: 'hidden', backgroundColor: CColors.surface },
  imgWide: { width: '100%', aspectRatio: 0.9, borderRadius: 20 },
  wideDetailCol: { flex: 1 },

  name: { fontSize: 28, fontWeight: '900', color: CColors.text },
  description: { fontSize: 14, color: CColors.textSecondary, lineHeight: 21, marginTop: -4 },
  price: { fontSize: 22, fontWeight: '700', color: CColors.primary },

  optionsBlock: {
    gap: 20,
    backgroundColor: CColors.surface,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: CColors.border,
  },
  section: { gap: 10 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 14, fontWeight: '800', color: CColors.text, flex: 1 },
  required: { color: CColors.error, fontWeight: '900' },
  extraPrice: { fontSize: 13, fontWeight: '700', color: CColors.primary },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22,
    borderWidth: 1.5, borderColor: CColors.border, backgroundColor: CColors.surfaceAlt,
  },
  optionActive: { backgroundColor: CColors.primary, borderColor: CColors.primary },
  optionText: { fontSize: 13, color: CColors.textSecondary, fontWeight: '600' },
  optionTextActive: { color: '#000', fontWeight: '800' },

  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  qtyBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: CColors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: CColors.border,
  },
  qtyBtnText: { fontSize: 24, color: CColors.text, fontWeight: '300' },
  qty: { fontSize: 22, fontWeight: '900', color: CColors.text, minWidth: 32, textAlign: 'center' },
  closedNote: { fontSize: 12, color: CColors.error, textAlign: 'center' },
});
