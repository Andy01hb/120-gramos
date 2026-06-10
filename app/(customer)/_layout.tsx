import { Tabs, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBar } from '../../components/ui/TabBar';
import { WebTopNav } from '../../components/customer/WebTopNav';
import { useAuth } from '../../contexts/AuthContext';
import { CColors } from '../../constants/colors';

const HREFS = [
  '/(customer)',
  '/(customer)/menu',
  '/(customer)/orders',
  '/(customer)/profile',
] as const;

function AdminPreviewBanner() {
  const { setPreviewMode } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  function exitPreview() {
    setPreviewMode(false);
    router.replace('/(admin)' as any);
  }

  return (
    <View style={[bannerStyles.bar, { paddingTop: insets.top > 0 ? insets.top : 12 }]}>
      <Text style={bannerStyles.label}>Vista previa · admin</Text>
      <TouchableOpacity style={bannerStyles.btn} onPress={exitPreview}>
        <Text style={bannerStyles.btnText}>← Volver al panel</Text>
      </TouchableOpacity>
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  bar: {
    backgroundColor: '#1a0a00',
    borderBottomWidth: 1,
    borderBottomColor: CColors.primary + '55',
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { fontSize: 11, color: CColors.primary, fontWeight: '700', letterSpacing: 0.5 },
  btn: {
    backgroundColor: CColors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  btnText: { fontSize: 12, fontWeight: '800', color: '#000' },
});

export default function CustomerLayout() {
  const { user, previewMode } = useAuth();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const isAdminPreview = user?.role === 'admin' && previewMode;

  const tabs = (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => {
        if (isWeb) return null;
        const tabItems = [
          { name: 'index',   label: 'Inicio',   icon: 'home' as const    },
          { name: 'menu',    label: 'Menú',     icon: 'menu' as const    },
          { name: 'orders',  label: 'Pedidos',  icon: 'orders' as const  },
          { name: 'profile', label: 'Perfil',   icon: 'profile' as const },
        ];
        return (
          <TabBar
            tabs={tabItems}
            activeIndex={props.state.index}
            onPress={(i) => router.navigate(HREFS[i] as any)}
          />
        );
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="menu" />
      <Tabs.Screen name="orders" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );

  if (isWeb) {
    return (
      <View style={{ flex: 1, backgroundColor: CColors.background, overflow: 'hidden' }}>
        {isAdminPreview && <AdminPreviewBanner />}
        <WebTopNav />
        <View style={{ flex: 1, overflow: 'hidden' }}>{tabs}</View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {isAdminPreview && <AdminPreviewBanner />}
      {tabs}
    </View>
  );
}
