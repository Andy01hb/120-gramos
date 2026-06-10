import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Alert, StyleSheet, Image, ActivityIndicator, Switch, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app, db } from '../../lib/firebase';
import { useMenu } from '../../hooks/useMenu';
import { useCategories } from '../../hooks/useCategories';
import { Colors } from '../../constants/colors';
import type { MenuItem, ProductOption, OptionType } from '../../types';

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen.')); };
    img.src = url;
  });
}

async function pickAndUploadImage(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') { reject(new Error('Solo disponible en web')); return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) { reject(new Error('No se seleccionó archivo')); return; }
      try {
        const { width, height } = await getImageDimensions(file);
        const ratio = width / height;
        if (ratio > 1.25) {
          reject(new Error(
            `Proporción incorrecta: ${width}×${height} px.\n` +
            `Las imágenes de producto deben ser cuadradas o verticales (1:1).\n` +
            `Recomendado: 800×800 px (PNG sin fondo).`
          ));
          return;
        }
        if (width < 400 || height < 400) {
          reject(new Error(`Imagen demasiado pequeña: ${width}×${height} px.\nMínimo: 400×400 px. Recomendado: 800×800 px.`));
          return;
        }
      } catch (err: any) { reject(err); return; }
      const filename = `${Date.now()}_${file.name}`;
      const storageRef = ref(getStorage(app), `menu/${filename}`);
      await uploadBytes(storageRef, file, { contentType: file.type });
      resolve(await getDownloadURL(storageRef));
    };
    input.click();
  });
}

function newOption(): ProductOption {
  return {
    id: Date.now().toString(),
    question: '',
    type: 'single',
    choices: [],
    extraPrice: 0,
    required: false,
  };
}

interface EditState {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
  available: boolean;
  options: ProductOption[];
}

function initEdit(item: MenuItem): EditState {
  return {
    name: item.name,
    description: item.description ?? '',
    price: String(item.price),
    category: item.category,
    imageUrl: item.imageUrl ?? '',
    available: item.available,
    options: item.options ? [...item.options] : [],
  };
}

// ── Options editor for a single ProductOption ──
function OptionEditor({
  opt,
  onChange,
  onRemove,
}: {
  opt: ProductOption;
  onChange: (updated: ProductOption) => void;
  onRemove: () => void;
}) {
  const [newChoice, setNewChoice] = useState('');

  function addChoice() {
    const c = newChoice.trim();
    if (!c || opt.choices.includes(c)) return;
    onChange({ ...opt, choices: [...opt.choices, c] });
    setNewChoice('');
  }

  return (
    <View style={styles.optionCard}>
      <View style={styles.optionHeader}>
        <Text style={styles.optionNum}>Pregunta</Text>
        <TouchableOpacity onPress={onRemove} style={styles.optionRemoveBtn}>
          <Text style={styles.optionRemoveText}>✕ Eliminar</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        value={opt.question}
        onChangeText={v => onChange({ ...opt, question: v })}
        placeholder="Ej: ¿Qué sabor deseas?"
        placeholderTextColor={Colors.textSecondary}
      />

      {/* Type selector */}
      <View style={styles.typeRow}>
        {(['single', 'boolean'] as OptionType[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.typePill, opt.type === t && styles.typePillActive]}
            onPress={() => onChange({ ...opt, type: t, choices: t === 'boolean' ? [] : opt.choices })}
          >
            <Text style={[styles.typePillText, opt.type === t && styles.typePillTextActive]}>
              {t === 'single' ? 'Una opción' : 'Sí / No'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Choices (only for single) */}
      {opt.type === 'single' && (
        <>
          <View style={styles.choicesWrap}>
            {opt.choices.map(c => (
              <TouchableOpacity
                key={c}
                style={styles.choiceChip}
                onPress={() => onChange({ ...opt, choices: opt.choices.filter(x => x !== c) })}
              >
                <Text style={styles.choiceChipText}>{c} ×</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.choiceAddRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={newChoice}
              onChangeText={setNewChoice}
              placeholder="Agregar opción..."
              placeholderTextColor={Colors.textSecondary}
              onSubmitEditing={addChoice}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.choiceAddBtn} onPress={addChoice}>
              <Text style={styles.choiceAddBtnText}>+ Agregar</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Extra price */}
      <View style={styles.priceRow}>
        <Text style={styles.optionMeta}>Precio extra: $</Text>
        <TextInput
          style={[styles.input, styles.priceInput]}
          value={opt.extraPrice > 0 ? String(opt.extraPrice) : ''}
          onChangeText={v => onChange({ ...opt, extraPrice: parseFloat(v) || 0 })}
          placeholder="0"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="decimal-pad"
        />
        <Text style={styles.optionMeta}>  Requerida</Text>
        <Switch
          value={opt.required}
          onValueChange={v => onChange({ ...opt, required: v })}
          trackColor={{ true: Colors.primary, false: Colors.border }}
          thumbColor="#fff"
        />
      </View>
    </View>
  );
}

function MenuItemCard({ item, categories }: { item: MenuItem; categories: string[] }) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<EditState>(() => initEdit(item));
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  function set<K extends keyof EditState>(key: K, val: EditState[K]) {
    setEdit(prev => ({ ...prev, [key]: val }));
  }

  async function uploadCustomImage() {
    setUploadingImg(true);
    try {
      const url = await pickAndUploadImage();
      set('imageUrl', url);
    } catch (e: any) {
      if (e.message !== 'No se seleccionó archivo') Alert.alert('Imagen inválida', e?.message ?? 'No se pudo subir la imagen.');
    } finally {
      setUploadingImg(false);
    }
  }

  function addOption() {
    set('options', [...edit.options, newOption()]);
  }

  function updateOption(index: number, updated: ProductOption) {
    const next = [...edit.options];
    next[index] = updated;
    set('options', next);
  }

  function removeOption(index: number) {
    set('options', edit.options.filter((_, i) => i !== index));
  }

  async function save() {
    const price = parseFloat(edit.price);
    if (!edit.name.trim()) { Alert.alert('Error', 'El nombre no puede estar vacío.'); return; }
    if (isNaN(price) || price <= 0) { Alert.alert('Error', 'El precio debe ser mayor a 0.'); return; }
    for (const opt of edit.options) {
      if (!opt.question.trim()) { Alert.alert('Error', 'Todas las preguntas deben tener texto.'); return; }
      if (opt.type === 'single' && opt.choices.length < 1) {
        Alert.alert('Error', `La pregunta "${opt.question}" necesita al menos una opción.`); return;
      }
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'menu', item.id), {
        name: edit.name.trim(),
        description: edit.description.trim() || null,
        price,
        category: edit.category,
        imageUrl: edit.imageUrl || null,
        available: edit.available,
        options: edit.options,
      });
      setOpen(false);
    } catch {
      Alert.alert('Error', 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.card}>
      {/* ── Summary row ── */}
      <TouchableOpacity style={styles.summary} onPress={() => { if (!open) setEdit(initEdit(item)); setOpen(o => !o); }} activeOpacity={0.7}>
        <View style={styles.thumb}>
          {item.imageUrl
            ? <Image source={{ uri: item.imageUrl }} style={styles.thumbImg} resizeMode="contain" />
            : <Text style={styles.thumbIcon}>☕</Text>
          }
        </View>
        <View style={styles.summaryInfo}>
          <Text style={styles.summaryName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.summaryMeta}>
            <Text style={styles.metaPrice}>${item.price}</Text>
            <Text style={styles.metaCat}>{item.category}</Text>
            {item.isFeatured && <View style={styles.featuredDot}><Text style={styles.featuredDotText}>★</Text></View>}
          </View>
        </View>
        <View style={styles.summaryRight}>
          <View style={[styles.pill, item.available ? styles.pillOn : styles.pillOff]}>
            <Text style={styles.pillText}>{item.available ? 'Activo' : 'Inactivo'}</Text>
          </View>
          <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* ── Edit form ── */}
      {open && (
        <View style={styles.form}>

          {/* Image picker */}
          <Text style={styles.fieldLabel}>IMAGEN</Text>
          <View style={styles.imgPickerRow}>
            {/* Sin imagen */}
            <TouchableOpacity
              style={[styles.imgThumb, !edit.imageUrl && styles.imgThumbSelected]}
              onPress={() => set('imageUrl', '')}
            >
              <Text style={{ fontSize: 22 }}>✕</Text>
              <Text style={styles.imgThumbLabel}>Sin imagen</Text>
            </TouchableOpacity>

            {/* Current assigned image */}
            {edit.imageUrl ? (
              <View style={styles.imgThumbWrap}>
                <View style={[styles.imgThumb, styles.imgThumbSelected]}>
                  <Image source={{ uri: edit.imageUrl }} style={styles.imgThumbImg} resizeMode="contain" />
                </View>
                <TouchableOpacity style={styles.imgDeleteOverlay} onPress={() => set('imageUrl', '')}>
                  <Text style={styles.imgDeleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Upload new */}
            <TouchableOpacity
              style={[styles.imgThumb, styles.imgThumbUpload]}
              onPress={uploadCustomImage}
              disabled={uploadingImg}
            >
              {uploadingImg
                ? <ActivityIndicator color={Colors.primary} size="small" />
                : <>
                    <Text style={styles.imgThumbUploadIcon}>↑</Text>
                    <Text style={styles.imgThumbLabel}>Subir</Text>
                  </>
              }
            </TouchableOpacity>
          </View>

          <Text style={styles.sizeHint}>PNG sin fondo · cuadrada (1:1) · mín. 400×400 px · recomendado 800×800 px</Text>

          {/* Name */}
          <Text style={styles.fieldLabel}>NOMBRE</Text>
          <TextInput
            style={styles.input}
            value={edit.name}
            onChangeText={v => set('name', v)}
            placeholder="Nombre del producto"
            placeholderTextColor={Colors.textSecondary}
          />

          {/* Description */}
          <Text style={styles.fieldLabel}>DESCRIPCIÓN</Text>
          <TextInput
            style={[styles.input, styles.descInput]}
            value={edit.description}
            onChangeText={v => set('description', v)}
            placeholder="Ingredientes, notas de sabor, etc."
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={3}
          />

          {/* Price */}
          <Text style={styles.fieldLabel}>PRECIO (MXN)</Text>
          <View style={styles.priceRow}>
            <Text style={styles.peso}>$</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={edit.price}
              onChangeText={v => set('price', v)}
              keyboardType="decimal-pad"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          {/* Category */}
          <Text style={styles.fieldLabel}>CATEGORÍA</Text>
          <View style={styles.catRow}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catPill, edit.category === cat && styles.catPillActive]}
                onPress={() => set('category', cat)}
              >
                <Text style={[styles.catPillText, edit.category === cat && styles.catPillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Disponible */}
          <View style={styles.switchRow}>
            <View style={styles.switchItem}>
              <Switch
                value={edit.available}
                onValueChange={v => set('available', v)}
                trackColor={{ true: Colors.success, false: Colors.border }}
                thumbColor="#fff"
              />
              <Text style={styles.switchLabel}>Disponible</Text>
            </View>
          </View>

          {/* Preguntas al cliente */}
          <Text style={styles.fieldLabel}>PREGUNTAS AL CLIENTE</Text>
          <Text style={styles.subHint}>Lo que el cliente elige al agregar al carrito (tamaño, extras, etc.)</Text>

          {edit.options.map((opt, i) => (
            <OptionEditor
              key={opt.id}
              opt={opt}
              onChange={updated => updateOption(i, updated)}
              onRemove={() => removeOption(i)}
            />
          ))}

          <TouchableOpacity style={styles.addOptionBtn} onPress={addOption}>
            <Text style={styles.addOptionBtnText}>+ Agregar pregunta</Text>
          </TouchableOpacity>

          {/* Save */}
          <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#000" size="small" />
              : <Text style={styles.saveBtnText}>Guardar cambios</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function MenuMgmtScreen() {
  const { items, loading } = useMenu();
  const categories = useCategories();
  const isWeb = Platform.OS === 'web';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.content, isWeb && styles.contentWeb]}>
        <View style={styles.header}>
          <Text style={styles.title}>Menú</Text>
          <Text style={styles.sub}>{items.length} productos · {items.filter(i => !i.available).length} inactivos</Text>
        </View>
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          renderItem={({ item }) => <MenuItemCard item={item} categories={categories} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={!loading ? <Text style={styles.empty}>Sin productos</Text> : null}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1 },
  contentWeb: { maxWidth: 860, alignSelf: 'center' as const, width: '100%' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 2 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.primary },
  sub: { fontSize: 13, color: Colors.textSecondary },
  list: { padding: 16 },
  empty: { textAlign: 'center', color: Colors.textSecondary, marginTop: 40 },

  // ── Card ──
  card: { backgroundColor: Colors.surface, borderRadius: 14, overflow: 'hidden', borderLeftWidth: 3, borderLeftColor: Colors.primary },

  // ── Summary ──
  summary: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  thumb: {
    width: 52, height: 52, borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  thumbImg: { width: 52, height: 52 },
  thumbIcon: { fontSize: 24 },
  summaryInfo: { flex: 1, gap: 4 },
  summaryName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  summaryMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaPrice: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  metaCat: { fontSize: 11, color: Colors.textSecondary },
  featuredDot: { backgroundColor: Colors.primary + '30', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  featuredDotText: { fontSize: 10, color: Colors.primary },
  summaryRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  pillOn: { backgroundColor: '#1a2a1a' },
  pillOff: { backgroundColor: '#2a1a1a' },
  pillText: { fontSize: 10, fontWeight: '800', color: Colors.text },
  chevron: { fontSize: 11, color: Colors.textSecondary },

  // ── Form ──
  form: { padding: 14, paddingTop: 0, gap: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  fieldLabel: { fontSize: 10, fontWeight: '900', color: Colors.textSecondary, letterSpacing: 1, marginTop: 8 },

  imgPickerRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  imgThumb: {
    width: 72, height: 80, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt, borderWidth: 2, borderColor: 'transparent', gap: 4,
  },
  imgThumbSelected: { borderColor: Colors.primary },
  imgThumbUpload: { borderColor: Colors.border, borderStyle: 'dashed' },
  imgThumbUploadIcon: { fontSize: 22, color: Colors.primary, fontWeight: '900' },
  imgThumbImg: { width: 56, height: 56 },
  imgThumbLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '700' },
  imgThumbWrap: { position: 'relative' as const },
  imgDeleteOverlay: {
    position: 'absolute' as const, top: 2, right: 2,
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 8,
    width: 18, height: 18, alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  imgDeleteText: { fontSize: 9, color: '#fff', fontWeight: '900' as const },
  sizeHint: { fontSize: 10, color: Colors.textSecondary, lineHeight: 15, marginTop: -4 },
  descInput: { minHeight: 72, textAlignVertical: 'top', paddingTop: 10 },

  input: {
    backgroundColor: Colors.surfaceAlt, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    color: Colors.text, fontSize: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  peso: { fontSize: 18, fontWeight: '700', color: Colors.primary },

  catRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  catPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  catPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catPillText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  catPillTextActive: { color: '#000' },

  switchRow: { flexDirection: 'row', gap: 20, marginTop: 6 },
  switchItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontSize: 13, fontWeight: '700', color: Colors.text },
  subLabel: { fontSize: 12, fontWeight: '800', color: Colors.textSecondary, letterSpacing: 0.3, marginTop: 4 },
  subHint: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16, marginTop: -4 },

  // ── Options editor ──
  choiceAddRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  choiceAddBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  choiceAddBtnText: { fontSize: 13, fontWeight: '800', color: '#000' },
  optionCard: {
    backgroundColor: Colors.surfaceAlt, borderRadius: 12,
    padding: 12, gap: 8, borderWidth: 1, borderColor: Colors.border,
  },
  optionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionNum: { fontSize: 11, fontWeight: '900', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  optionRemoveBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  optionRemoveText: { fontSize: 11, fontWeight: '700', color: Colors.error },
  typeRow: { flexDirection: 'row', gap: 8 },
  typePill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  typePillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typePillText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  typePillTextActive: { color: '#000' },
  choicesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  choiceChip: {
    backgroundColor: Colors.surface, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.border,
  },
  choiceChipText: { fontSize: 12, color: Colors.text, fontWeight: '600' },
  optionMeta: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  priceInput: { width: 72, textAlign: 'center' },
  addOptionBtn: {
    borderRadius: 10, padding: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed',
  },
  addOptionBtnText: { fontSize: 13, fontWeight: '800', color: Colors.primary },

  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    padding: 14, alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { fontSize: 14, fontWeight: '900', color: '#000' },
});
