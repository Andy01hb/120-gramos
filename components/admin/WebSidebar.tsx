import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useStand } from '../../contexts/StandContext';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/colors';

interface NavItem {
  label: string;
  icon: string;
  href: '/(admin)' | '/(admin)/orders' | '/(admin)/stand' | '/(admin)/menu-mgmt' | '/(admin)/profile';
  segment: string;
}

const NAV: NavItem[] = [
  { label: 'Dashboard',  icon: '◈', href: '/(admin)',            segment: 'index'     },
  { label: 'Pedidos',    icon: '◷', href: '/(admin)/orders',     segment: 'orders'    },
  { label: 'Stand',      icon: '⬡', href: '/(admin)/stand',      segment: 'stand'     },
  { label: 'Menú',       icon: '≡', href: '/(admin)/menu-mgmt',  segment: 'menu-mgmt' },
  { label: 'Perfil',     icon: '○', href: '/(admin)/profile',    segment: 'profile'   },
];

export function WebSidebar() {
  const router = useRouter();
  const segments = useSegments();
  const { isOpen } = useStand();
  const { user, logout } = useAuth();

  const activeSegment = segments[segments.length - 1] ?? 'index';

  return (
    <View style={styles.sidebar}>
      {/* Brand */}
      <View style={styles.brand}>
        <Text style={styles.brandName}>120<Text style={styles.brandSub}>GRAMOS</Text></Text>
        <Text style={styles.brandTagline}>PANEL ADMIN</Text>
      </View>

      {/* Stand status badge */}
      <View style={[styles.standBadge, isOpen ? styles.standOpen : styles.standClosed]}>
        <View style={[styles.standDot, { backgroundColor: isOpen ? Colors.success : Colors.error }]} />
        <Text style={[styles.standLabel, { color: isOpen ? Colors.success : Colors.error }]}>
          {isOpen ? 'STAND ABIERTO' : 'STAND CERRADO'}
        </Text>
      </View>

      {/* Nav */}
      <View style={styles.nav}>
        {NAV.map(item => {
          const isActive = activeSegment === item.segment ||
            (item.segment === 'index' && activeSegment === '(admin)');
          return (
            <TouchableOpacity
              key={item.href}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => router.navigate(item.href as any)}
            >
              <Text style={[styles.navIcon, isActive && styles.navIconActive]}>{item.icon}</Text>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerUser} numberOfLines={1}>{user?.email}</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 180,
    backgroundColor: '#111',
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  brand: { paddingBottom: 8 },
  brandName: { fontSize: 24, fontWeight: '900', color: Colors.primary, letterSpacing: -1 },
  brandSub: { fontSize: 10, fontWeight: '700', letterSpacing: 3 },
  brandTagline: { fontSize: 9, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 4, marginTop: 2 },

  standBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginBottom: 8,
  },
  standOpen: { backgroundColor: '#1a2a1a' },
  standClosed: { backgroundColor: '#2a1a1a' },
  standDot: { width: 6, height: 6, borderRadius: 3 },
  standLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  nav: { flex: 1, gap: 2 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
  },
  navItemActive: { backgroundColor: Colors.primary + '18', borderLeftWidth: 3, borderLeftColor: Colors.primary },
  navIcon: { fontSize: 16, color: Colors.textSecondary, width: 20 },
  navIconActive: { color: Colors.primary },
  navLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  navLabelActive: { color: Colors.text, fontWeight: '800' },

  footer: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16, gap: 10 },
  footerUser: { fontSize: 11, color: Colors.textSecondary },
  logoutBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  logoutText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
});
