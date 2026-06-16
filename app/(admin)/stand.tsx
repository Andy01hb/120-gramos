import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, ScrollView, ActivityIndicator, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app, db } from '../../lib/firebase';
import { useStand } from '../../contexts/StandContext';
import { useCarousel } from '../../hooks/useCarousel';
import { useHomeSections } from '../../hooks/useHomeSections';
import { useCategories } from '../../hooks/useCategories';
import { useMenu } from '../../hooks/useMenu';
import { setStandOpen } from '../../lib/firestore';
import { StandHoursEditor } from '../../components/admin/StandHoursEditor';
import { Colors } from '../../constants/colors';
import { FONT_OPTIONS } from '../../lib/fonts';
import type { HomeSection, MenuItem } from '../../types';

// ─── Upload helpers ───────────────────────────────────────────────────────────

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen.')); };
    img.src = url;
  });
}

async function pickAndUploadBanner(): Promise<string> {
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
        if (Math.abs(ratio - 2) > 0.2) {
          reject(new Error(
            `Proporción incorrecta: ${width}×${height} px (${ratio.toFixed(2)}:1).\n` +
            `El carrusel requiere imágenes con proporción 2:1.\nRecomendado: 1000×500 px.`
          ));
          return;
        }
        if (width < 800) {
          reject(new Error(`Imagen demasiado pequeña: ${width}×${height} px.\nMínimo: 800×400 px.`));
          return;
        }
      } catch (err: any) { reject(err); return; }
      const filename = `${Date.now()}_${file.name}`;
      const storageRef = ref(getStorage(app), `banners/${filename}`);
      await uploadBytes(storageRef, file, { contentType: file.type });
      resolve(await getDownloadURL(storageRef));
    };
    input.click();
  });
}

async function pickAndUploadFloatImage(): Promise<string> {
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
        if (width < 200 || height < 200) {
          reject(new Error(`Imagen demasiado pequeña: ${width}×${height} px.\nMínimo recomendado: 400×500 px.`));
          return;
        }
      } catch (err: any) { reject(err); return; }
      const filename = `${Date.now()}_${file.name}`;
      const storageRef = ref(getStorage(app), `home/${filename}`);
      await uploadBytes(storageRef, file, { contentType: file.type });
      resolve(await getDownloadURL(storageRef));
    };
    input.click();
  });
}

async function pickAndUploadIcon(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') { reject(new Error('Solo disponible en web')); return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) { reject(new Error('No se seleccionó archivo')); return; }
      try {
        const { width, height } = await getImageDimensions(file);
        if (width < 48 || height < 48) {
          reject(new Error(`Ícono demasiado pequeño: ${width}×${height} px.\nRecomendado: 96×96 px (cuadrado, PNG transparente).`));
          return;
        }
      } catch (err: any) { reject(err); return; }
      const filename = `icon_${Date.now()}_${file.name}`;
      const storageRef = ref(getStorage(app), `home/${filename}`);
      await uploadBytes(storageRef, file, { contentType: file.type });
      resolve(await getDownloadURL(storageRef));
    };
    input.click();
  });
}

// ─── Section editor card ──────────────────────────────────────────────────────

interface SectionEditorProps {
  section: HomeSection;
  allItems: MenuItem[];
  onUpdate: (changes: Partial<HomeSection>) => Promise<void>;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function normalizeHex(raw: string): string | null {
  const stripped = raw.replace(/^#/, '').trim();
  if (/^[0-9A-Fa-f]{6}$/.test(stripped)) return '#' + stripped.toUpperCase();
  if (/^[0-9A-Fa-f]{3}$/.test(stripped)) return '#' + stripped.toUpperCase();
  return null;
}

const PRESET_COLORS = [
  '#C8960A', '#D4AF37', '#FFC107', '#FF9800', '#FF6D00',
  '#8B4513', '#A0522D', '#D2691E', '#E8A87C', '#DEB887',
  '#C62828', '#E53935', '#FF6B6B', '#EC407A', '#880E4F',
  '#2E7D32', '#43A047', '#00897B', '#0288D1', '#01579B',
  '#6A1B9A', '#4527A0', '#37474F', '#212121', '#455A64',
];

function ColorPickerField({ value, onSave }: { value: string; onSave: (hex: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(value.replace('#', '').toUpperCase());
  const [livePreview, setLivePreview] = useState(value);

  useEffect(() => {
    setHex(value.replace('#', '').toUpperCase());
    setLivePreview(value);
  }, [value]);

  const liveColor = normalizeHex(hex) ?? livePreview;
  const isSelected = (preset: string) => preset.replace('#', '').toUpperCase() === hex.toUpperCase();

  function openWebPicker() {
    if (typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'color';
    input.value = normalizeHex(hex) ?? value;
    input.addEventListener('input', (e: any) => {
      const picked: string = e.target.value;
      setHex(picked.replace('#', '').toUpperCase());
      setLivePreview(picked);
    });
    input.addEventListener('change', async (e: any) => {
      const picked: string = e.target.value;
      setHex(picked.replace('#', '').toUpperCase());
      setLivePreview(picked);
      await onSave(picked);
    });
    input.click();
  }

  async function handlePreset(preset: string) {
    setHex(preset.replace('#', '').toUpperCase());
    setLivePreview(preset);
    await onSave(preset);
  }

  async function handleHexBlur() {
    const normalized = normalizeHex(hex);
    if (normalized) {
      setHex(normalized.replace('#', ''));
      setLivePreview(normalized);
      if (normalized !== value) await onSave(normalized);
    } else {
      setHex(value.replace('#', '').toUpperCase());
      setLivePreview(value);
    }
  }

  if (Platform.OS === 'web') {
    return (
      <TouchableOpacity
        style={[styles.colorTrigger, { backgroundColor: liveColor }]}
        onPress={openWebPicker}
        activeOpacity={0.85}
      >
        <Text style={styles.colorTriggerHex}>#{hex || '------'}</Text>
        <Text style={styles.colorTriggerArrow}>🎨 Cambiar</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.colorTrigger, { backgroundColor: liveColor }]}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.85}
      >
        <Text style={styles.colorTriggerHex}>#{hex || '------'}</Text>
        <Text style={styles.colorTriggerArrow}>{open ? '▲' : '▼ Cambiar'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.colorPanel}>
          <View style={[styles.colorPreviewBar, { backgroundColor: liveColor }]}>
            <Text style={styles.colorPreviewLabel}>#{hex.toUpperCase()}</Text>
          </View>

          <View style={styles.colorGrid}>
            {PRESET_COLORS.map(preset => (
              <TouchableOpacity
                key={preset}
                style={[styles.colorPresetSwatch, { backgroundColor: preset }, isSelected(preset) && styles.colorPresetSwatchSelected]}
                onPress={() => handlePreset(preset)}
              >
                {isSelected(preset) && <Text style={styles.colorPresetCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.colorHexRow}>
            <Text style={styles.colorHash}>#</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={hex}
              onChangeText={v => setHex(v.replace(/^#/, '').toUpperCase())}
              onBlur={handleHexBlur}
              placeholder="C8960A"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="characters"
              maxLength={6}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function SectionEditorCard({ section, allItems, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: SectionEditorProps) {
  const [title, setTitle] = useState(section.title);
  const [icon, setIcon] = useState(section.icon ?? '⭐');
  const [uploading, setUploading] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const isTitleFocused = useRef(false);
  const isIconFocused = useRef(false);

  useEffect(() => {
    if (!isTitleFocused.current) setTitle(section.title);
    if (!isIconFocused.current) setIcon(section.icon ?? '⭐');
  }, [section.title, section.icon]);

  async function saveTitle() {
    const t = title.trim();
    if (!t || t === section.title) return;
    await onUpdate({ title: t });
  }

  async function saveIcon() {
    const ic = icon.trim();
    if (!ic || ic === (section.icon ?? '⭐')) return;
    await onUpdate({ icon: ic });
  }

  async function uploadImage() {
    setUploading(true);
    try {
      const url = await pickAndUploadFloatImage();
      await onUpdate({ imageUrl: url });
    } catch (e: any) {
      if (e.message !== 'No se seleccionó archivo') Alert.alert('Error', e?.message ?? 'No se pudo subir.');
    } finally { setUploading(false); }
  }

  async function uploadIcon() {
    setUploadingIcon(true);
    try {
      const url = await pickAndUploadIcon();
      await onUpdate({ iconImageUrl: url });
    } catch (e: any) {
      if (e.message !== 'No se seleccionó archivo') Alert.alert('Error', e?.message ?? 'No se pudo subir.');
    } finally { setUploadingIcon(false); }
  }

  async function toggleProduct(productId: string) {
    const ids = section.productIds.includes(productId)
      ? section.productIds.filter(id => id !== productId)
      : [...section.productIds, productId];
    await onUpdate({ productIds: ids });
  }

  return (
    <View style={styles.sectionCard}>
      {/* Header */}
      <View style={styles.sectionCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>TÍTULO</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            onFocus={() => { isTitleFocused.current = true; }}
            onBlur={() => { isTitleFocused.current = false; saveTitle(); }}
            placeholder="Nombre de la sección"
            placeholderTextColor={Colors.textSecondary}
            returnKeyType="done"
          />
        </View>
        <View style={styles.sectionCardControls}>
          <TouchableOpacity style={[styles.ctrlBtn, isFirst && styles.ctrlBtnDisabled]} onPress={onMoveUp} disabled={isFirst}>
            <Text style={styles.ctrlBtnText}>▲</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ctrlBtn, isLast && styles.ctrlBtnDisabled]} onPress={onMoveDown} disabled={isLast}>
            <Text style={styles.ctrlBtnText}>▼</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ctrlBtn, styles.ctrlBtnDelete]} onPress={onDelete}>
            <Text style={styles.ctrlBtnDeleteText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Icon (PNG or emoji) */}
      <Text style={styles.fieldLabel}>ÍCONO DE LA SECCIÓN</Text>
      <View style={styles.iconRow}>
        {section.iconImageUrl ? (
          <View style={styles.iconPreviewWrap}>
            <Image source={{ uri: section.iconImageUrl }} style={styles.iconPreview} resizeMode="contain" />
            <TouchableOpacity style={styles.floatRemoveBtn} onPress={() => onUpdate({ iconImageUrl: null })}>
              <Text style={styles.floatRemoveText}>✕ Quitar PNG</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.iconUploadBtn} onPress={uploadIcon} disabled={uploadingIcon}>
            {uploadingIcon
              ? <ActivityIndicator color={Colors.primary} size="small" />
              : <Text style={styles.floatUploadText}>↑ Subir ícono PNG</Text>}
          </TouchableOpacity>
        )}
        <View style={styles.iconField}>
          <Text style={styles.subLabel}>o emoji</Text>
          <TextInput
            style={[styles.input, styles.iconInput]}
            value={icon}
            onChangeText={setIcon}
            onFocus={() => { isIconFocused.current = true; }}
            onBlur={() => { isIconFocused.current = false; saveIcon(); }}
            placeholder="⭐"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
      </View>
      <Text style={styles.sizeHint}>PNG cuadrado transparente · 96×96 px. Si subes PNG, se usa en vez del emoji.</Text>

      {/* Colors */}
      <View style={styles.iconColorRow}>
        <View style={styles.colorField}>
          <Text style={styles.fieldLabel}>COLOR DEL RECUADRO</Text>
          <ColorPickerField
            value={section.color ?? '#C8960A'}
            onSave={hex => onUpdate({ color: hex })}
          />
        </View>
        <View style={styles.colorField}>
          <Text style={styles.fieldLabel}>COLOR DEL TEXTO</Text>
          <ColorPickerField
            value={section.titleColor ?? '#1C0800'}
            onSave={hex => onUpdate({ titleColor: hex })}
          />
        </View>
      </View>

      {/* Font picker */}
      <Text style={styles.fieldLabel}>TIPO DE LETRA DEL TÍTULO</Text>
      <View style={styles.fontRow}>
        {FONT_OPTIONS.map(opt => {
          const active = (section.titleFont ?? 'default') === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.fontChip, active && styles.fontChipActive]}
              onPress={() => onUpdate({ titleFont: opt.key })}
            >
              <Text style={[styles.fontChipText, active && styles.fontChipTextActive, opt.family ? { fontFamily: opt.family } : null]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Float image */}
      <Text style={styles.fieldLabel}>BEBIDA FLOTANTE</Text>
      {section.imageUrl ? (
        <View style={styles.floatImgRow}>
          <Image source={{ uri: section.imageUrl }} style={styles.floatImgPreview} resizeMode="contain" />
          <TouchableOpacity style={styles.floatRemoveBtn} onPress={() => onUpdate({ imageUrl: null })}>
            <Text style={styles.floatRemoveText}>✕ Quitar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.floatUploadBtn} onPress={uploadImage} disabled={uploading}>
          {uploading
            ? <ActivityIndicator color={Colors.primary} size="small" />
            : <Text style={styles.floatUploadText}>↑ Subir imagen de bebida</Text>
          }
        </TouchableOpacity>
      )}
      <Text style={styles.sizeHint}>PNG transparente · proporción 4:5 · ≈600×750 px (mín. 400×500).</Text>

      {/* Product picker */}
      <Text style={styles.fieldLabel}>PRODUCTOS EN ESTA SECCIÓN</Text>
      <Text style={styles.pickerHint}>Toca un producto para incluirlo o quitarlo.</Text>
      <View style={styles.pickerGrid}>
        {allItems.map(item => {
          const active = section.productIds.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.pickerChip, active && styles.pickerChipActive]}
              onPress={() => toggleProduct(item.id)}
            >
              {item.imageUrl
                ? <Image source={{ uri: item.imageUrl }} style={styles.pickerThumb} resizeMode="contain" />
                : <Text style={styles.pickerThumbIcon}>☕</Text>
              }
              <Text style={[styles.pickerName, active && styles.pickerNameActive]} numberOfLines={2}>
                {item.name}
              </Text>
              {active && <Text style={styles.pickerCheck}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function StandScreen() {
  const { isOpen, loading, settings } = useStand();
  const isAuto = settings?.mode === 'auto';
  const { images } = useCarousel();
  const sections = useHomeSections();
  const categories = useCategories();
  const { items: menuItems } = useMenu();

  const [uploading, setUploading] = useState(false);
  const [newCat, setNewCat] = useState('');

  const availableItems = menuItems.filter(i => i.available);

  // ── Stand toggle ──
  async function toggle() {
    try { await setStandOpen(!isOpen); }
    catch (e: any) { Alert.alert('Error', e?.message ?? 'No se pudo cambiar el estado.'); }
  }

  // ── Carousel ──
  async function addBanner() {
    setUploading(true);
    try {
      const url = await pickAndUploadBanner();
      await setDoc(doc(db, 'settings', 'carousel'), { images: [...images, url] }, { merge: true });
    } catch (e: any) {
      if (e.message !== 'No se seleccionó archivo') Alert.alert('Imagen inválida', e?.message ?? 'No se pudo subir.');
    } finally { setUploading(false); }
  }

  async function removeBanner(url: string) {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('¿Eliminar esta imagen del carrusel?')
      : await new Promise<boolean>(resolve =>
          Alert.alert('Eliminar imagen', '¿Estás seguro?', [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) },
          ])
        );
    if (!confirmed) return;
    try { await updateDoc(doc(db, 'settings', 'carousel'), { images: images.filter(u => u !== url) }); }
    catch { Alert.alert('Error', 'No se pudo eliminar la imagen.'); }
  }

  // ── Sections ──
  async function saveSections(updated: HomeSection[]) {
    await setDoc(doc(db, 'settings', 'home'), { sections: updated }, { merge: true });
  }

  async function updateSection(id: string, changes: Partial<HomeSection>) {
    const updated = sections.map(s => s.id === id ? { ...s, ...changes } : s);
    await saveSections(updated);
  }

  async function deleteSection(id: string) {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('¿Eliminar esta sección del inicio?')
      : await new Promise<boolean>(resolve =>
          Alert.alert('Eliminar sección', '¿Estás seguro?', [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) },
          ])
        );
    if (!confirmed) return;
    const updated = sections.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i }));
    await saveSections(updated);
  }

  async function moveSection(id: string, dir: -1 | 1) {
    const sorted = [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = sorted.findIndex(s => s.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sorted.length) return;
    const swapped = [...sorted];
    [swapped[idx], swapped[newIdx]] = [swapped[newIdx], swapped[idx]];
    await saveSections(swapped.map((s, i) => ({ ...s, order: i })));
  }

  async function addSection() {
    const newSec: HomeSection = {
      id: Date.now().toString(),
      title: 'Nueva sección',
      icon: '⭐',
      color: '#C8960A',
      imageUrl: null,
      productIds: [],
      order: sections.length,
    };
    await saveSections([...sections, newSec]);
  }

  // ── Categories ──
  async function addCategory() {
    const cat = newCat.trim();
    if (!cat) return;
    if (categories.includes(cat)) { setNewCat(''); return; }
    await setDoc(doc(db, 'settings', 'categories'), { categories: [...categories, cat] });
    setNewCat('');
  }

  async function removeCategory(cat: string) {
    const confirmed = Platform.OS === 'web'
      ? window.confirm(`¿Eliminar la categoría "${cat}"?`)
      : await new Promise<boolean>(resolve =>
          Alert.alert('Eliminar categoría', `¿Eliminar "${cat}"?`, [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) },
          ])
        );
    if (!confirmed) return;
    await setDoc(doc(db, 'settings', 'categories'), { categories: categories.filter(c => c !== cat) });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>Control del stand</Text>

        {/* ── Stand open/close ── */}
        <View style={[styles.card, isOpen ? styles.cardOpen : styles.cardClosed]}>
          <Text style={styles.statusEmoji}>{isOpen ? '🟢' : '🔴'}</Text>
          <Text style={styles.statusLabel}>{isOpen ? 'ABIERTO' : 'CERRADO'}</Text>
          <Text style={styles.statusSub}>
            {isOpen ? 'Los clientes pueden hacer pedidos ahora' : 'Los pedidos están deshabilitados'}
          </Text>
        </View>
        {isAuto ? (
          <Text style={styles.note}>🕒 Modo automático: el stand abre y cierra solo según el horario de abajo.</Text>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.toggleBtn, isOpen ? styles.toggleBtnClose : styles.toggleBtnOpen]}
              onPress={toggle}
              disabled={loading}
            >
              <Text style={styles.toggleBtnText}>{isOpen ? 'Cerrar el stand' : 'Abrir el stand'}</Text>
            </TouchableOpacity>
            <Text style={styles.note}>Este cambio afecta a todos los clientes en tiempo real.</Text>
          </>
        )}

        {/* ── Horario y local ── */}
        <StandHoursEditor />

        {/* ── Carousel images ── */}
        <Text style={styles.sectionTitle}>Imágenes del carrusel</Text>
        <Text style={styles.sectionSub}>JPG o PNG · proporción 2:1 · mínimo 800×400 px</Text>
        <View style={styles.bannerGrid}>
          {images.map((url, i) => (
            <View key={i} style={styles.bannerItem}>
              <Image source={{ uri: url }} style={styles.bannerImg} resizeMode="cover" />
              <TouchableOpacity style={styles.bannerDelete} onPress={() => removeBanner(url)}>
                <Text style={styles.bannerDeleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.bannerAdd} onPress={addBanner} disabled={uploading}>
            {uploading
              ? <ActivityIndicator color={Colors.primary} />
              : <><Text style={styles.bannerAddIcon}>+</Text><Text style={styles.bannerAddText}>Agregar</Text></>
            }
          </TouchableOpacity>
        </View>

        {/* ── Categories ── */}
        <Text style={styles.sectionTitle}>Categorías del menú</Text>
        <Text style={styles.sectionSub}>Los clientes las ven como filtros en el menú. Los productos deben actualizarse manualmente si cambias un nombre.</Text>
        <View style={styles.catChipRow}>
          {categories.map(cat => (
            <TouchableOpacity key={cat} style={styles.catChip} onPress={() => removeCategory(cat)}>
              <Text style={styles.catChipText}>{cat}</Text>
              <Text style={styles.catChipX}>×</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.catAddRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={newCat}
            onChangeText={setNewCat}
            placeholder="Nueva categoría..."
            placeholderTextColor={Colors.textSecondary}
            onSubmitEditing={addCategory}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtn} onPress={addCategory}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* ── Home sections ── */}
        <View style={styles.sectionsTitleRow}>
          <View>
            <Text style={styles.sectionTitle}>Secciones del inicio</Text>
            <Text style={styles.sectionSub}>Crea las que quieras · elige qué bebidas aparecen en cada una.</Text>
          </View>
          <TouchableOpacity style={styles.newSectionBtn} onPress={addSection}>
            <Text style={styles.newSectionBtnText}>+ Nueva</Text>
          </TouchableOpacity>
        </View>

        {sections.length === 0 && (
          <View style={styles.emptySections}>
            <Text style={styles.emptySectionsIcon}>☕</Text>
            <Text style={styles.emptySectionsText}>No hay secciones. Toca "+ Nueva" para crear la primera.</Text>
          </View>
        )}

        {sections.map((sec, idx) => (
          <SectionEditorCard
            key={sec.id}
            section={sec}
            allItems={availableItems}
            onUpdate={changes => updateSection(sec.id, changes)}
            onDelete={() => deleteSection(sec.id)}
            onMoveUp={() => moveSection(sec.id, -1)}
            onMoveDown={() => moveSection(sec.id, 1)}
            isFirst={idx === 0}
            isLast={idx === sections.length - 1}
          />
        ))}

        {sections.length > 0 && (
          <TouchableOpacity style={styles.addSectionBtn} onPress={addSection}>
            <Text style={styles.addSectionBtnText}>+ Agregar otra sección</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  body: { padding: 24, gap: 16 },
  title: { fontSize: 26, fontWeight: '900', color: Colors.primary, textAlign: 'center' },

  card: { borderRadius: 20, padding: 28, alignItems: 'center', gap: 10 },
  cardOpen: { backgroundColor: '#1a2a1a' },
  cardClosed: { backgroundColor: '#2a1a1a' },
  statusEmoji: { fontSize: 48 },
  statusLabel: { fontSize: 26, fontWeight: '900', color: Colors.text, letterSpacing: 2 },
  statusSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  toggleBtn: { borderRadius: 16, padding: 16, alignItems: 'center' },
  toggleBtnClose: { backgroundColor: Colors.error },
  toggleBtnOpen: { backgroundColor: Colors.success },
  toggleBtnText: { fontSize: 17, fontWeight: '900', color: '#fff' },
  note: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },

  sectionTitle: { fontSize: 16, fontWeight: '900', color: Colors.text, marginTop: 8 },
  sectionSub: { fontSize: 12, color: Colors.textSecondary, marginTop: -4, lineHeight: 18 },

  bannerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  bannerItem: { width: 160, height: 90, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  bannerImg: { width: '100%', height: '100%' },
  bannerDelete: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12,
    width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
  },
  bannerDeleteText: { fontSize: 12, color: '#fff', fontWeight: '900' },
  bannerAdd: {
    width: 160, height: 90, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  bannerAddIcon: { fontSize: 24, color: Colors.primary, fontWeight: '900' },
  bannerAddText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },

  // ── Categories ──
  catChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surface, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  catChipText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  catChipX: { fontSize: 14, fontWeight: '900', color: Colors.error },
  catAddRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },

  // ── Section list header ──
  sectionsTitleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 },
  newSectionBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  newSectionBtnText: { fontSize: 13, fontWeight: '900', color: '#000' },

  emptySections: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptySectionsIcon: { fontSize: 36 },
  emptySectionsText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  addSectionBtn: {
    borderRadius: 12, padding: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed',
  },
  addSectionBtnText: { fontSize: 13, fontWeight: '800', color: Colors.primary },

  // ── Section editor card ──
  sectionCard: {
    backgroundColor: Colors.surface, borderRadius: 14,
    padding: 14, gap: 10, borderWidth: 1, borderColor: Colors.border,
  },
  sectionCardHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  sectionCardControls: { flexDirection: 'row', gap: 6, paddingBottom: 2 },
  ctrlBtn: {
    width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border,
  },
  ctrlBtnDisabled: { opacity: 0.3 },
  ctrlBtnDelete: { backgroundColor: Colors.error + '22', borderColor: Colors.error + '55' },
  ctrlBtnText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },
  ctrlBtnDeleteText: { fontSize: 12, color: Colors.error, fontWeight: '900' },

  fieldLabel: { fontSize: 10, fontWeight: '900', color: Colors.textSecondary, letterSpacing: 1, marginTop: 2 },
  input: {
    backgroundColor: Colors.surfaceAlt, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    color: Colors.text, fontSize: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  addBtn: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { fontSize: 24, fontWeight: '900', color: '#000', lineHeight: 28 },

  iconColorRow: { flexDirection: 'row', gap: 10 },
  iconField: { width: 80 },
  iconInput: { textAlign: 'center', fontSize: 18 },
  iconRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  iconPreviewWrap: { alignItems: 'center', gap: 6 },
  iconPreview: { width: 48, height: 48, borderRadius: 8, backgroundColor: Colors.surfaceAlt },
  iconUploadBtn: {
    borderWidth: 1, borderColor: Colors.primary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center',
  },
  subLabel: { fontSize: 10, color: Colors.textSecondary, marginBottom: 4 },
  sizeHint: { fontSize: 11, color: Colors.textSecondary, marginTop: 6, marginBottom: 2 },
  fontRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fontChip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surfaceAlt,
  },
  fontChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  fontChipText: { fontSize: 14, color: Colors.text, fontWeight: '700' },
  fontChipTextActive: { color: '#000' },
  colorField: { flex: 1 },

  colorTrigger: {
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  colorTriggerHex: { fontSize: 13, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  colorTriggerArrow: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },

  colorPanel: {
    marginTop: 6, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  colorPreviewBar: { height: 52, alignItems: 'center', justifyContent: 'center' },
  colorPreviewLabel: { fontSize: 13, fontWeight: '900', color: 'rgba(255,255,255,0.9)', letterSpacing: 1 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 7 },
  colorPresetSwatch: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  colorPresetSwatchSelected: { borderColor: '#fff' },
  colorPresetCheck: { fontSize: 14, fontWeight: '900', color: '#fff' },
  colorHexRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingBottom: 10 },
  colorHash: { fontSize: 14, fontWeight: '800', color: Colors.textSecondary },

  floatImgRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  floatImgPreview: { width: 60, height: 80, borderRadius: 8, backgroundColor: Colors.surfaceAlt },
  floatRemoveBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.error },
  floatRemoveText: { fontSize: 12, color: Colors.error, fontWeight: '700' },
  floatUploadBtn: {
    paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed', alignItems: 'center',
  },
  floatUploadText: { fontSize: 13, color: Colors.primary, fontWeight: '700' },

  pickerHint: { fontSize: 11, color: Colors.textSecondary, marginTop: -6 },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerChip: {
    width: 90, alignItems: 'center', gap: 4, padding: 8,
    backgroundColor: Colors.surfaceAlt, borderRadius: 12,
    borderWidth: 2, borderColor: 'transparent',
  },
  pickerChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '18' },
  pickerThumb: { width: 48, height: 52, borderRadius: 6 },
  pickerThumbIcon: { fontSize: 28, height: 52, textAlignVertical: 'center' },
  pickerName: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center', fontWeight: '600', lineHeight: 14 },
  pickerNameActive: { color: Colors.primary, fontWeight: '800' },
  pickerCheck: { fontSize: 11, color: Colors.primary, fontWeight: '900' },
});
