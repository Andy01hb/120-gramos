import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useStand } from '../../contexts/StandContext';
import { CColors } from '../../constants/colors';

const NAV = [
  { label: 'Inicio',   href: '/(customer)',         segment: 'index'   },
  { label: 'Menú',     href: '/(customer)/menu',    segment: 'menu'    },
  { label: 'Pedidos',  href: '/(customer)/orders',  segment: 'orders'  },
  { label: 'Perfil',   href: '/(customer)/profile', segment: 'profile' },
];

export function WebTopNav() {
  const router = useRouter();
  const segments = useSegments();
  const { isOpen } = useStand();
  const { width } = useWindowDimensions();
  const compact = width < 680;   // phone browser
  const tiny = width < 420;      // very narrow

  const activeSegment = segments[segments.length - 1] ?? 'index';

  return (
    <View style={[styles.nav, compact && styles.navCompact]}>
      <View style={styles.brand}>
        <Text style={[styles.brandText, compact && styles.brandTextCompact]}>120</Text>
        {!tiny && <Text style={styles.brandSub}>GRAMOS</Text>}
      </View>

      <View style={[styles.links, compact && styles.linksCompact]}>
        {NAV.map(item => {
          const isActive = activeSegment === item.segment ||
            (item.segment === 'index' && activeSegment === '(customer)');
          return (
            <TouchableOpacity
              key={item.href}
              onPress={() => router.navigate(item.href as any)}
              style={[styles.link, compact && styles.linkCompact, isActive && styles.linkActive]}
            >
              <Text style={[styles.linkText, compact && styles.linkTextCompact, isActive && styles.linkTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.statusBadge, compact && styles.statusBadgeCompact, { backgroundColor: isOpen ? '#0D2B14' : '#2B0D0D' }]}>
        <View style={[styles.dot, { backgroundColor: isOpen ? CColors.success : CColors.error }]} />
        {!tiny && (
          <Text style={[styles.statusText, { color: isOpen ? CColors.success : CColors.error }]}>
            {isOpen ? 'ABIERTO' : 'CERRADO'}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CColors.surface,
    borderBottomWidth: 1, borderBottomColor: CColors.border,
    paddingHorizontal: 32, height: 60, gap: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  navCompact: { paddingHorizontal: 10, gap: 8, height: 54 },
  brand: { flexDirection: 'row', alignItems: 'baseline', gap: 1 },
  brandText: { fontSize: 22, fontWeight: '900', color: CColors.primary, letterSpacing: -1 },
  brandTextCompact: { fontSize: 18 },
  brandSub: { fontSize: 7, fontWeight: '900', color: CColors.textSecondary, letterSpacing: 3, marginLeft: 2 },

  links: { flex: 1, flexDirection: 'row', gap: 2, justifyContent: 'center' },
  linksCompact: { gap: 0 },
  link: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  linkCompact: { paddingHorizontal: 7 },
  linkActive: { backgroundColor: CColors.primary + '20' },
  linkText: { fontSize: 14, fontWeight: '600', color: CColors.textSecondary },
  linkTextCompact: { fontSize: 12 },
  linkTextActive: { color: CColors.primary, fontWeight: '800' },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  statusBadgeCompact: { paddingHorizontal: 7, paddingVertical: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});
