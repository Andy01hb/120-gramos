import { useState } from 'react';
import { ScrollView, View, Text, Image, StyleSheet, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { HeroCarousel } from '../../components/home/HeroCarousel';
import { CategoryPills } from '../../components/home/CategoryPills';
import { ProductCardRow } from '../../components/home/ProductCardRow';
import { SkeletonCard } from '../../components/ui/SkeletonCard';
import { useStand } from '../../contexts/StandContext';
import { scheduleSummary } from '../../lib/standHours';
import { fontFamilyFor } from '../../lib/fonts';
import { useMenu } from '../../hooks/useMenu';
import { useCarousel } from '../../hooks/useCarousel';
import { useHomeSections } from '../../hooks/useHomeSections';
import { CColors } from '../../constants/colors';
import type { MenuItem } from '../../types';

function SkeletonRow() {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={{ width: 140 }}><SkeletonCard /></View>
      ))}
    </ScrollView>
  );
}

interface AmberSectionProps {
  title: string;
  icon: string;
  iconImageUrl?: string | null;
  iconSize?: number;
  color: string;
  titleColor?: string;
  titleFont?: string;
  floatImageUrl: string | null;
  items: MenuItem[];
}

function AmberSection({ title, icon, iconImageUrl, iconSize, color, titleColor, titleFont, floatImageUrl, items }: AmberSectionProps) {
  const family = fontFamilyFor(titleFont);
  const size = iconSize ?? 26;
  return (
    <View style={styles.featuredOuter}>
      {floatImageUrl && (
        <View style={styles.overflowWrap}>
          <Image source={{ uri: floatImageUrl }} style={styles.overflowImg} resizeMode="contain" />
        </View>
      )}
      <View style={[styles.featuredBlock, !floatImageUrl && styles.featuredBlockNoFloat, { backgroundColor: color }]}>
        <View style={styles.featuredLabelRow}>
          {iconImageUrl
            ? <Image source={{ uri: iconImageUrl }} style={[styles.featuredIcon, { width: size, height: size }]} resizeMode="contain" />
            : (icon ? <Text style={[styles.featuredLabel, { fontSize: size }, titleColor ? { color: titleColor } : null, family ? { fontFamily: family } : null]}>{icon} </Text> : null)}
          <Text style={[styles.featuredLabel, titleColor ? { color: titleColor } : null, family ? { fontFamily: family } : null]}>{title}</Text>
        </View>
        <ProductCardRow items={items} variant="warm" alwaysScroll />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { isOpen, settings } = useStand();
  const homeLocation = settings?.location || 'Plaza de los Enamorados · Río Bravo, Tamps.';
  const scheduleText = scheduleSummary(settings) || 'Sáb y Dom · Desde 5:00 PM';
  const [category, setCategory] = useState<string>('all');
  const { items, loading, error } = useMenu(category === 'all' ? undefined : category);
  const { items: allItems } = useMenu();
  const { images: carouselImages, loading: carouselLoading } = useCarousel();
  const sections = useHomeSections();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  // Wide layout: web browser OR native tablet/iPad (width > 900 to exclude phones in landscape)
  const wideLayout = isWeb || width > 900;

  return (
    <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
      {!isWeb && (
        <View style={styles.topbar}>
          <View style={styles.location}>
            <Svg width={13} height={13} viewBox="0 0 24 24">
              <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={CColors.primary} />
            </Svg>
            <Text style={styles.locationText}>{homeLocation}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isOpen ? '#0D2B14' : '#2B0D0D' }]}>
            <View style={[styles.statusDot, { backgroundColor: isOpen ? CColors.success : CColors.error }]} />
            <Text style={[styles.statusText, { color: isOpen ? CColors.success : CColors.error }]}>
              {isOpen ? 'Abierto' : 'Cerrado'}
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, wideLayout && styles.scrollWide]}
      >
        <HeroCarousel imageUrls={carouselImages} loading={carouselLoading} />
        <CategoryPills active={category} onChange={setCategory} />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>📡</Text>
            <Text style={styles.errorTitle}>Sin conexión con la barra</Text>
            <Text style={styles.errorText}>No pudimos cargar el menú. Inténtalo de nuevo más tarde.</Text>
          </View>
        ) : loading ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>MÁS VENDIDOS</Text>
              <SkeletonRow />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>EXPLORA EL MENÚ</Text>
              <SkeletonRow />
            </View>
          </>
        ) : items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>☕</Text>
            <Text style={styles.emptyTitle}>El menú está llegando</Text>
            <Text style={styles.emptyText}>Estamos preparando nuestras bebidas. ¡Vuelve pronto!</Text>
          </View>
        ) : (
          <>
            {/* ─── Dynamic sections (always stacked) ─── */}
            {category === 'all' && sections.map(sec => {
              const secItems = allItems.filter(i => sec.productIds.includes(i.id));
              if (secItems.length === 0) return null;
              return (
                <AmberSection
                  key={sec.id}
                  title={sec.title}
                  icon={sec.icon ?? ''}
                  iconImageUrl={sec.iconImageUrl}
                  iconSize={sec.iconSize}
                  color={sec.color ?? '#C8960A'}
                  titleColor={sec.titleColor}
                  titleFont={sec.titleFont}
                  floatImageUrl={sec.imageUrl}
                  items={secItems}
                />
              );
            })}

            {/* ─── Regular menu section ─── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>EXPLORA EL MENÚ</Text>
                <TouchableOpacity onPress={() => router.navigate('/(customer)/menu' as any)}>
                  <Text style={styles.sectionLink}>Ver todo</Text>
                </TouchableOpacity>
              </View>
              <ProductCardRow items={items} variant="dark" />
            </View>

            <View style={styles.standCard}>
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={CColors.primary} />
              </Svg>
              <View>
                <Text style={styles.standTitle}>{scheduleText}</Text>
                <Text style={styles.standSub}>{homeLocation}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CColors.background },

  topbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: CColors.background,
  },
  location: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationText: { fontSize: 13, fontWeight: '700', color: CColors.text },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  scroll: { gap: 0, paddingBottom: 32 },
  scrollWide: { maxWidth: 1280, alignSelf: 'center' as const, width: '100%' },

  section: { gap: 12, marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingRight: 16,
  },
  sectionTitle: {
    fontSize: 20, fontWeight: '900', color: CColors.text,
    paddingHorizontal: 16,
  },
  sectionLink: { fontSize: 13, fontWeight: '700', color: CColors.primary },

  featuredOuter: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  overflowWrap: {
    alignItems: 'center',
    marginBottom: -90,
    zIndex: 10,
  },
  overflowImg: {
    width: 140,
    height: 170,
  },
  featuredBlock: {
    backgroundColor: '#C8960A',
    borderRadius: 20,
    paddingTop: 96,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  featuredBlockNoFloat: {
    paddingTop: 20,
  },
  featuredLabelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, marginBottom: 10,
  },
  featuredIcon: { width: 26, height: 26 },
  featuredLabel: {
    fontSize: 20, fontWeight: '900', color: '#1C0800',
  },

  errorBox: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32, gap: 10 },
  errorIcon: { fontSize: 44 },
  errorTitle: { fontSize: 16, fontWeight: '900', color: CColors.text },
  errorText: { fontSize: 13, color: CColors.textSecondary, textAlign: 'center', lineHeight: 20 },

  emptyCard: { marginHorizontal: 16, marginTop: 40, alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 52, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: CColors.text },
  emptyText: { fontSize: 13, color: CColors.textSecondary, textAlign: 'center', lineHeight: 20 },

  standCard: {
    marginHorizontal: 16, marginTop: 24,
    backgroundColor: CColors.surfaceWarm,
    borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: CColors.border,
  },
  standTitle: { fontSize: 13, fontWeight: '700', color: CColors.primary },
  standSub: { fontSize: 11, color: CColors.textSecondary, marginTop: 2 },
});
