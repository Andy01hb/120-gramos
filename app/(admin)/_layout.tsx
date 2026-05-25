import { Tabs } from 'expo-router';
import { TabBar } from '../../components/ui/TabBar';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => {
        const tabs = [
          { name: 'orders/index', label: 'Pedidos', icon: 'orders' as const },
          { name: 'stand', label: 'Stand', icon: 'stand' as const },
          { name: 'menu-mgmt', label: 'Menú', icon: 'menu-mgmt' as const },
        ];
        return <TabBar tabs={tabs} activeIndex={props.state.index} onPress={(i) => props.navigation.navigate(tabs[i].name)} />;
      }}
    >
      <Tabs.Screen name="orders/index" />
      <Tabs.Screen name="stand" />
      <Tabs.Screen name="menu-mgmt" />
    </Tabs>
  );
}
