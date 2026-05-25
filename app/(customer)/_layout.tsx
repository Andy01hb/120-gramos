import { Tabs } from 'expo-router';
import { TabBar } from '../../components/ui/TabBar';

export default function CustomerLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => {
        const tabs = [
          { name: 'index', label: 'Inicio', icon: 'home' as const },
          { name: 'menu', label: 'Menú', icon: 'menu' as const },
          { name: 'orders', label: 'Pedidos', icon: 'orders' as const },
          { name: 'profile', label: 'Perfil', icon: 'profile' as const },
        ];
        return <TabBar tabs={tabs} activeIndex={props.state.index} onPress={(i) => props.navigation.navigate(tabs[i].name)} />;
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="menu" />
      <Tabs.Screen name="orders" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
