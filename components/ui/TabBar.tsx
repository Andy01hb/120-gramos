import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Svg, Path, Rect, Circle, Line } from 'react-native-svg';
import { Colors } from '../../constants/colors';

interface TabItem { name: string; label: string; icon: 'home' | 'menu' | 'orders' | 'profile' | 'stand' | 'menu-mgmt' }

function Icon({ type, active }: { type: TabItem['icon']; active: boolean }) {
  const color = active ? '#000' : Colors.textSecondary;
  const w = 20; const h = 20;
  if (type === 'home') return (
    <Svg width={w} height={h} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke={color} strokeWidth={1.8} fill={active ? color : 'none'} />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
  if (type === 'menu') return (
    <Svg width={w} height={h} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8h1a4 4 0 010 8h-1" stroke={color} strokeWidth={1.8} />
      <Path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" stroke={color} strokeWidth={1.8} fill={active ? color : 'none'} />
      <Line x1="6" y1="1" x2="6" y2="4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="10" y1="1" x2="10" y2="4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="14" y1="1" x2="14" y2="4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
  if (type === 'orders') return (
    <Svg width={w} height={h} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="2" width="14" height="20" rx="2" stroke={color} strokeWidth={1.8} fill={active ? color : 'none'} />
      <Line x1="9" y1="7" x2="15" y2="7" stroke={active ? '#000' : color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="9" y1="11" x2="15" y2="11" stroke={active ? '#000' : color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="9" y1="15" x2="12" y2="15" stroke={active ? '#000' : color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
  if (type === 'profile') return (
    <Svg width={w} height={h} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.8} fill={active ? color : 'none'} />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
  if (type === 'stand') return (
    <Svg width={w} height={h} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth={1.8} fill={active ? color : 'none'} />
      <Path d="M9 22V12h6v10" stroke={active ? '#000' : color} strokeWidth={1.8} />
    </Svg>
  );
  // menu-mgmt
  return (
    <Svg width={w} height={h} viewBox="0 0 24 24" fill="none">
      <Line x1="8" y1="6" x2="21" y2="6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="8" y1="12" x2="21" y2="12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="8" y1="18" x2="21" y2="18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx="3" cy="6" r="1.5" fill={color} />
      <Circle cx="3" cy="12" r="1.5" fill={color} />
      <Circle cx="3" cy="18" r="1.5" fill={color} />
    </Svg>
  );
}

interface Props {
  tabs: TabItem[];
  activeIndex: number;
  onPress: (index: number) => void;
}

export function TabBar({ tabs, activeIndex, onPress }: Props) {
  return (
    <View style={styles.bar}>
      {tabs.map((tab, i) => {
        const active = i === activeIndex;
        return (
          <TouchableOpacity key={tab.name} style={[styles.pill, active && styles.pillActive]} onPress={() => onPress(i)}>
            <Icon type={tab.icon} active={active} />
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#000', borderTopWidth: 1, borderTopColor: Colors.border,
    paddingVertical: 8, paddingHorizontal: 4,
  },
  pill: { alignItems: 'center', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20, gap: 2 },
  pillActive: { backgroundColor: Colors.primary },
  label: { fontSize: 9, fontWeight: '600', color: Colors.textSecondary },
  labelActive: { color: '#000' },
});
