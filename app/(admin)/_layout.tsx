import { Tabs, useRouter } from 'expo-router';
import { View, Platform } from 'react-native';
import { TabBar } from '../../components/ui/TabBar';
import { WebSidebar } from '../../components/admin/WebSidebar';

const HREFS = [
  '/(admin)',
  '/(admin)/orders',
  '/(admin)/pos',
  '/(admin)/stand',
  '/(admin)/menu-mgmt',
  '/(admin)/profile',
] as const;

export default function AdminLayout() {
  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  const tabs = (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => {
        if (isWeb) return null;
        const tabItems = [
          { name: 'index',    label: 'Dashboard', icon: 'home' as const     },
          { name: 'orders',   label: 'Pedidos',   icon: 'orders' as const   },
          { name: 'pos',      label: 'Caja',      icon: 'caja' as const     },
          { name: 'stand',    label: 'Stand',     icon: 'stand' as const    },
          { name: 'menu-mgmt', label: 'Menú',     icon: 'menu-mgmt' as const },
          { name: 'profile',  label: 'Perfil',    icon: 'profile' as const  },
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
      <Tabs.Screen name="orders" />
      <Tabs.Screen name="pos" />
      <Tabs.Screen name="stand" />
      <Tabs.Screen name="menu-mgmt" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );

  if (isWeb) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#0a0a0a', overflow: 'hidden' }}>
        <WebSidebar />
        <View style={{ flex: 1, overflow: 'hidden' }}>{tabs}</View>
      </View>
    );
  }

  return tabs;
}
