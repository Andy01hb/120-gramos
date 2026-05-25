import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useMenu } from '../../hooks/useMenu';
import { Colors } from '../../constants/colors';
import type { MenuItem } from '../../types';

export default function MenuMgmtScreen() {
  const { items, loading } = useMenu();
  const [editing, setEditing] = useState<Record<string, string>>({});

  async function toggleAvailable(item: MenuItem) {
    try {
      await updateDoc(doc(db, 'menu', item.id), { available: !item.available });
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la disponibilidad.');
    }
  }

  async function savePrice(item: MenuItem) {
    const raw = editing[item.id];
    const price = parseFloat(raw);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Precio inválido', 'Ingresa un número mayor a 0.');
      return;
    }
    try {
      await updateDoc(doc(db, 'menu', item.id), { price });
      setEditing(prev => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el precio.');
    }
  }

  function renderItem({ item }: { item: MenuItem }) {
    const isDirty = editing[item.id] !== undefined;

    return (
      <View style={[styles.card, !item.available && styles.cardDisabled]}>
        <View style={styles.cardTop}>
          <Text style={[styles.name, !item.available && styles.nameDisabled]} numberOfLines={1}>
            {item.name}
          </Text>
          <TouchableOpacity
            style={[styles.toggle, item.available ? styles.toggleOn : styles.toggleOff]}
            onPress={() => toggleAvailable(item)}
          >
            <Text style={styles.toggleText}>{item.available ? 'Disponible' : 'No disponible'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Precio</Text>
          <View style={styles.priceInputWrap}>
            <Text style={styles.peso}>$</Text>
            <TextInput
              style={styles.priceInput}
              keyboardType="decimal-pad"
              value={isDirty ? editing[item.id] : String(item.price)}
              onChangeText={val => setEditing(prev => ({ ...prev, [item.id]: val }))}
              selectTextOnFocus
              placeholderTextColor={Colors.textSecondary}
            />
            {isDirty && (
              <TouchableOpacity style={styles.saveBtn} onPress={() => savePrice(item)}>
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Menú</Text>
        <Text style={styles.sub}>{items.filter(i => !i.available).length} no disponibles</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Sin productos</Text> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 2 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.primary },
  sub: { fontSize: 13, color: Colors.textSecondary },
  list: { padding: 16 },
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, gap: 10, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  cardDisabled: { borderLeftColor: '#333', opacity: 0.6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.text },
  nameDisabled: { color: Colors.textSecondary },
  toggle: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  toggleOn: { backgroundColor: '#1a2a1a' },
  toggleOff: { backgroundColor: '#2a1a1a' },
  toggleText: { fontSize: 11, fontWeight: '800', color: Colors.text },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, width: 44 },
  priceInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  peso: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  priceInput: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.text, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#333' },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  saveBtnText: { fontSize: 12, fontWeight: '900', color: '#000' },
  empty: { textAlign: 'center', color: Colors.textSecondary, marginTop: 40, fontSize: 15 },
});
