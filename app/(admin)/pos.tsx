import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, app } from '../../lib/firebase';
import { useMenu } from '../../hooks/useMenu';
import { Colors } from '../../constants/colors';
import type { MenuItem, OrderItem, OptionSelection, ProductOption } from '../../types';

type Method = 'clip' | 'cash';

export default function PosScreen() {
  const { items: menu } = useMenu();
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [method, setMethod] = useState<Method>('clip');
  const [selecting, setSelecting] = useState<MenuItem | null>(null);

  // Clip terminal serial, persisted in settings/clip
  const [clipSerial, setClipSerial] = useState('');
  const [serialDraft, setSerialDraft] = useState('');
  const [editingSerial, setEditingSerial] = useState(false);

  // Charge flow
  const [charging, setCharging] = useState(false);
  const [waitOrderId, setWaitOrderId] = useState<string | null>(null);
  const [waitError, setWaitError] = useState<string | null>(null);

  // In-screen feedback (Alert.alert is a no-op on react-native-web)
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  function notify(type: 'ok' | 'err', msg: string) { setBanner({ type, msg }); }

  const available = useMemo(() => menu.filter(m => m.available), [menu]);
  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const count = cart.reduce((s, i) => s + i.quantity, 0);

  // Load the configured terminal serial
  useEffect(() => {
    return onSnapshot(doc(db, 'config', 'clip'), snap => {
      const s = (snap.data()?.serialNumberPos as string) ?? '';
      setClipSerial(s);
      setSerialDraft(s);
    });
  }, []);

  // Watch the Clip order while charging
  useEffect(() => {
    if (!waitOrderId) return;
    const unsub = onSnapshot(doc(db, 'orders', waitOrderId), snap => {
      const data = snap.data();
      if (!data) return;
      if (data.paymentStatus === 'paid') {
        setWaitOrderId(null);
        setCart([]);
        notify('ok', '✅ Pago aprobado. El pedido se envió a la cocina.');
      } else if (data.paymentStatus === 'failed' || data.status === 'cancelled') {
        setWaitError('El cobro no se completó o fue cancelado en la terminal.');
      }
    });
    return unsub;
  }, [waitOrderId]);

  function addToCart(newItem: OrderItem) {
    setCart(prev => {
      const existing = prev.find(i =>
        i.productId === newItem.productId &&
        JSON.stringify(i.selections) === JSON.stringify(newItem.selections));
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + newItem.quantity } : i);
      }
      return [...prev, newItem];
    });
  }

  function tapProduct(item: MenuItem) {
    if (item.options && item.options.length > 0) {
      setSelecting(item);
    } else {
      addToCart({ productId: item.id, name: item.name, quantity: 1, unitPrice: item.price, selections: [] });
    }
  }

  function changeQty(index: number, delta: number) {
    setCart(prev => prev.flatMap((i, idx) => {
      if (idx !== index) return [i];
      const q = i.quantity + delta;
      return q <= 0 ? [] : [{ ...i, quantity: q }];
    }));
  }

  async function saveSerial() {
    const s = serialDraft.trim();
    if (!s) return;
    await setDoc(doc(db, 'config', 'clip'), { serialNumberPos: s, updatedAt: serverTimestamp() }, { merge: true });
    setEditingSerial(false);
  }

  async function charge() {
    if (cart.length === 0) return;
    if (method === 'clip' && !clipSerial) {
      notify('err', 'Primero ingresa el número de serie de tu lector Clip.');
      setEditingSerial(true);
      return;
    }

    setCharging(true);
    setWaitError(null);
    setBanner(null);
    try {
      const fns = getFunctions(app, 'us-central1');
      const createCounterOrder = httpsCallable(fns, 'createCounterOrder');
      const res: any = await createCounterOrder({
        items: cart,
        paymentMethod: method,
        ...(method === 'clip' ? { serialNumberPos: clipSerial } : {}),
      });

      if (method === 'cash') {
        setCart([]);
        notify('ok', '✅ Pedido en efectivo registrado. Enviado a la cocina.');
      } else {
        // Wait for the terminal to confirm via webhook
        setWaitOrderId(res.data.orderId);
      }
    } catch (e: any) {
      const code = e?.code ?? '';
      const msg = e?.message ?? '';
      if (code.includes('not-found') || /not[- ]?found/i.test(msg)) {
        notify('err', 'La función de cobro aún no está desplegada en el servidor. Hay que correr "firebase deploy --only functions".');
      } else {
        notify('err', msg || 'No se pudo cobrar. Intenta de nuevo.');
      }
    } finally {
      setCharging(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.layout}>
        {/* ── Menu (left/top) ── */}
        <ScrollView style={styles.menuCol} contentContainerStyle={styles.menuContent}>
          <Text style={styles.h1}>Cobro en caja</Text>
          <Text style={styles.sub}>Toca las bebidas para agregarlas al pedido.</Text>
          <View style={styles.grid}>
            {available.map(item => (
              <TouchableOpacity key={item.id} style={styles.prodCard} onPress={() => tapProduct(item)}>
                <Text style={styles.prodName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.prodPrice}>${item.price}</Text>
              </TouchableOpacity>
            ))}
            {available.length === 0 && <Text style={styles.sub}>No hay productos disponibles.</Text>}
          </View>
        </ScrollView>

        {/* ── Cart (right/bottom) — single ScrollView, no nested flex:1 list (avoids RNW overlap) ── */}
        <View style={styles.cartCol}>
          <ScrollView contentContainerStyle={styles.cartScrollContent}>
            <Text style={styles.cartTitle}>Pedido {count > 0 ? `· ${count}` : ''}</Text>

            {banner && (
              <TouchableOpacity
                style={[styles.banner, banner.type === 'ok' ? styles.bannerOk : styles.bannerErr]}
                onPress={() => setBanner(null)}>
                <Text style={styles.bannerText}>{banner.msg}</Text>
                <Text style={styles.bannerClose}>✕</Text>
              </TouchableOpacity>
            )}

            {cart.length === 0 && <Text style={styles.cartEmpty}>Aún no agregas nada.</Text>}
            {cart.map((i, idx) => (
              <View key={`${i.productId}-${idx}`} style={styles.cartRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartName}>{i.name}</Text>
                  {i.selections.length > 0 && (
                    <Text style={styles.cartSel} numberOfLines={2}>
                      {i.selections.map(s => s.answer).join(' · ')}
                    </Text>
                  )}
                  <Text style={styles.cartUnit}>${i.unitPrice} c/u</Text>
                </View>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(idx, -1)}>
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qty}>{i.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(idx, 1)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Payment method */}
            <View style={styles.methodRow}>
              <TouchableOpacity
                style={[styles.methodBtn, method === 'clip' && styles.methodActive]}
                onPress={() => setMethod('clip')}>
                <Text style={[styles.methodText, method === 'clip' && styles.methodTextActive]}>💳 Tarjeta (Clip)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodBtn, method === 'cash' && styles.methodActive]}
                onPress={() => setMethod('cash')}>
                <Text style={[styles.methodText, method === 'cash' && styles.methodTextActive]}>💵 Efectivo</Text>
              </TouchableOpacity>
            </View>

            {/* Terminal serial config (only relevant for Clip) */}
            {method === 'clip' && (
              <View style={styles.serialBox}>
                {editingSerial || !clipSerial ? (
                  <View style={styles.serialEditRow}>
                    <TextInput
                      style={styles.serialInput}
                      value={serialDraft}
                      onChangeText={setSerialDraft}
                      placeholder="Nº de serie de la terminal Clip"
                      placeholderTextColor={Colors.textSecondary}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity style={styles.serialSave} onPress={saveSerial}>
                      <Text style={styles.serialSaveText}>Guardar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.serialView} onPress={() => setEditingSerial(true)}>
                    <Text style={styles.serialLabel}>Terminal: <Text style={styles.serialValue}>{clipSerial}</Text></Text>
                    <Text style={styles.serialEdit}>cambiar</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.chargeBtn, (cart.length === 0 || charging) && styles.chargeDisabled]}
              onPress={charge}
              disabled={cart.length === 0 || charging}>
              {charging
                ? <ActivityIndicator color="#000" />
                : <Text style={styles.chargeText}>
                    {method === 'clip' ? 'Cobrar con Clip' : 'Registrar pago'} · ${subtotal}
                  </Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* ── Product options overlay (plain in-tree overlay; avoids RNW Modal pointer bugs) ── */}
      {selecting && (
        <View style={styles.overlayAbs}>
          <ProductOptionsSheet
            item={selecting}
            onClose={() => setSelecting(null)}
            onAdd={(orderItem) => { addToCart(orderItem); setSelecting(null); }}
          />
        </View>
      )}

      {/* ── Clip waiting overlay ── */}
      {waitOrderId && (
        <View style={[styles.overlayAbs, styles.overlay]}>
          <View style={styles.waitCard}>
            {waitError ? (
              <>
                <Text style={styles.waitIcon}>⚠️</Text>
                <Text style={styles.waitTitle}>Cobro no completado</Text>
                <Text style={styles.waitSub}>{waitError}</Text>
                <TouchableOpacity style={styles.waitClose} onPress={() => { setWaitOrderId(null); setWaitError(null); }}>
                  <Text style={styles.waitCloseText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.waitTitle}>Cobrando en la terminal…</Text>
                <Text style={styles.waitSub}>Pídele al cliente que acerque o inserte su tarjeta en el lector Clip.</Text>
                <Text style={styles.waitAmount}>${subtotal} MXN</Text>
                <TouchableOpacity style={styles.waitClose} onPress={() => { setWaitOrderId(null); setWaitError(null); }}>
                  <Text style={styles.waitCloseText}>Cancelar espera</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Product options bottom sheet ──────────────────────────────────────────────
function ProductOptionsSheet({ item, onClose, onAdd }: {
  item: MenuItem;
  onClose: () => void;
  onAdd: (orderItem: OrderItem) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<string, OptionSelection>>({});
  const [missingMsg, setMissingMsg] = useState<string | null>(null);

  function selectOption(opt: ProductOption, answer: string) {
    const extraPrice = opt.type === 'boolean' && answer === 'Sí' ? opt.extraPrice
      : opt.type === 'single' ? opt.extraPrice : 0;
    setSelections(prev => ({ ...prev, [opt.id]: { optionId: opt.id, question: opt.question, answer, extraPrice } }));
    setMissingMsg(null);
  }

  const selectionsTotal = Object.values(selections).reduce((s, sel) => s + sel.extraPrice, 0);
  const total = (item.price + selectionsTotal) * quantity;

  function handleAdd() {
    const missing = item.options.find(o => o.required && !selections[o.id]);
    if (missing) { setMissingMsg(`Selecciona: ${missing.question}`); return; }
    onAdd({
      productId: item.id,
      name: item.name,
      quantity,
      unitPrice: item.price + selectionsTotal,
      selections: Object.values(selections),
    });
  }

  return (
    <View style={styles.sheetWrap}>
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
          <Text style={styles.sheetName}>{item.name}</Text>
          <Text style={styles.sheetPrice}>${item.price} MXN</Text>

          {item.options.map(opt => (
            <View key={opt.id} style={{ gap: 8 }}>
              <Text style={styles.sheetOptLabel}>
                {opt.question}{opt.required ? <Text style={{ color: Colors.error }}> *</Text> : null}
                {opt.extraPrice > 0 ? <Text style={styles.sheetExtra}>  +${opt.extraPrice}</Text> : null}
              </Text>
              <View style={styles.optChips}>
                {(opt.type === 'single' ? opt.choices : ['Sí', 'No']).map(choice => {
                  const sel = selections[opt.id]?.answer === choice;
                  return (
                    <TouchableOpacity key={choice}
                      style={[styles.chip, sel && styles.chipActive]}
                      onPress={() => selectOption(opt, choice)}>
                      <Text style={[styles.chipText, sel && styles.chipTextActive]}>{sel ? '✓ ' : ''}{choice}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          <View style={styles.qtyRowCenter}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => Math.max(1, q - 1))}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qty}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => Math.min(20, q + 1))}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {missingMsg && <Text style={styles.missingMsg}>{missingMsg}</Text>}
        <View style={styles.sheetActions}>
          <TouchableOpacity style={styles.sheetCancel} onPress={onClose}>
            <Text style={styles.sheetCancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sheetAdd} onPress={handleAdd}>
            <Text style={styles.sheetAddText}>Agregar · ${total}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background, position: 'relative' },
  layout: { flex: 1, flexDirection: isWeb ? 'row' : 'column' },
  overlayAbs: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },

  menuCol: { flex: 1 },
  menuContent: { padding: 16, gap: 4 },
  h1: { fontSize: 24, fontWeight: '900', color: Colors.primary },
  sub: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  prodCard: {
    width: 150, minHeight: 78, backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 12, justifyContent: 'space-between',
  },
  prodName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  prodPrice: { fontSize: 15, fontWeight: '900', color: Colors.primary, marginTop: 6 },

  cartCol: {
    width: isWeb ? 360 : undefined,
    backgroundColor: '#111',
    borderLeftWidth: isWeb ? 1 : 0, borderTopWidth: isWeb ? 0 : 1, borderColor: Colors.border,
    maxHeight: isWeb ? undefined : '55%',
  },
  cartScrollContent: { padding: 16, gap: 12 },
  cartTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 10, borderWidth: 1 },
  bannerOk: { backgroundColor: '#13251a', borderColor: Colors.success },
  bannerErr: { backgroundColor: '#2a1414', borderColor: Colors.error },
  bannerText: { flex: 1, fontSize: 12, color: Colors.text, fontWeight: '600', lineHeight: 17 },
  bannerClose: { fontSize: 12, color: Colors.textSecondary, fontWeight: '800' },
  cartEmpty: { fontSize: 13, color: Colors.textSecondary },
  cartRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surface, borderRadius: 12, padding: 10 },
  cartName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  cartSel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  cartUnit: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyRowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22, marginTop: 4 },
  qtyBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  qtyBtnText: { fontSize: 20, color: Colors.text, fontWeight: '400' },
  qty: { fontSize: 16, fontWeight: '900', color: Colors.text, minWidth: 24, textAlign: 'center' },

  methodRow: { flexDirection: 'row', gap: 8 },
  methodBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  methodActive: { borderColor: Colors.primary, backgroundColor: Colors.primary, borderWidth: 2 },
  methodText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  methodTextActive: { color: '#000', fontWeight: '900' },

  serialBox: { },
  serialEditRow: { flexDirection: 'row', gap: 8 },
  serialInput: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 10, color: Colors.text, fontSize: 13,
  },
  serialSave: { paddingHorizontal: 14, justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: 10 },
  serialSaveText: { fontSize: 13, fontWeight: '800', color: '#000' },
  serialView: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  serialLabel: { fontSize: 12, color: Colors.textSecondary },
  serialValue: { color: Colors.text, fontWeight: '700' },
  serialEdit: { fontSize: 12, color: Colors.primary, fontWeight: '700' },

  chargeBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  chargeDisabled: { opacity: 0.4 },
  chargeText: { fontSize: 16, fontWeight: '900', color: '#000' },

  // Options sheet
  sheetWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  sheet: {
    backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, gap: 12, maxHeight: '85%',
    ...(isWeb ? { maxWidth: 520, width: '100%', alignSelf: 'center', borderRadius: 24, marginBottom: 24 } : {}),
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 4 },
  sheetName: { fontSize: 22, fontWeight: '900', color: Colors.text },
  sheetPrice: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  sheetOptLabel: { fontSize: 14, fontWeight: '800', color: Colors.text },
  sheetExtra: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
  optChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#000', fontWeight: '800' },
  sheetActions: { flexDirection: 'row', gap: 10, paddingTop: 8 },
  sheetCancel: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  sheetCancelText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  sheetAdd: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.primary },
  sheetAddText: { fontSize: 15, fontWeight: '900', color: '#000' },
  missingMsg: { fontSize: 12, color: Colors.error, fontWeight: '700', textAlign: 'center' },

  // Clip waiting overlay
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 24 },
  waitCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 28, gap: 14, alignItems: 'center',
    maxWidth: 380, width: '100%', borderWidth: 1, borderColor: Colors.border,
  },
  waitIcon: { fontSize: 44 },
  waitTitle: { fontSize: 18, fontWeight: '900', color: Colors.text, textAlign: 'center' },
  waitSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19 },
  waitAmount: { fontSize: 28, fontWeight: '900', color: Colors.primary },
  waitClose: { marginTop: 6, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  waitCloseText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
});
