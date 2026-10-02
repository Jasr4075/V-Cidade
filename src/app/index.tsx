import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategories, useAnonymousId, useNearbyReports } from '@/hooks/useReports';
import { useLocation } from '@/hooks/useLocation';
import { CategoryGrid } from '@/components/CategoryGrid';
import { ReportCard } from '@/components/ReportCard';
import { MapViewComponent } from '@/components/MapView';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Button } from '@/components/Button';
import { DEFAULT_MAP_REGION } from '@/constants';
import { MaterialCommunityIcons, ICONS, type IconName, colors, palette, radii, spacing, fontSize, fontWeight, lineHeight, layout } from '@/theme';
export default function HomeScreen() {
  const { loading: anonLoading } = useAnonymousId();
  const {
    categories,
    loading: catLoading,
    error: catError,
    refresh: refreshCategories,
  } = useCategories();
  const {
    coordinates: userLocation,
    loading: locLoading,
    error: locError,
    getLocation,
  } = useLocation();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState(DEFAULT_MAP_REGION);
  const [showMap, setShowMap] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Desktop / web: a coluna de conteúdo para de crescer e o espaço lateral
  // vira fundo neutro, em vez de linhas de texto quilométricas.
  const isWide = width >= 900;

  const { reports, loading: reportsLoading, error: reportsError, refresh: refreshReports } =
    useNearbyReports(
      userLocation?.latitude ?? DEFAULT_MAP_REGION.latitude,
      userLocation?.longitude ?? DEFAULT_MAP_REGION.longitude,
      {
        radius: 5000,
        categoryId: selectedCategoryId || undefined,
        enabled: !locLoading,
      }
    );

  useEffect(() => {
    if (!userLocation) return;
    setMapRegion((prev) => ({
      ...prev,
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    }));
  }, [userLocation]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshCategories(), refreshReports()]);
    setRefreshing(false);
  }, [refreshCategories, refreshReports]);

  // Filtrar por categoria não deve empurrar o usuário para o formulário:
  // primeiro filtra a lista, e a navegação para "registrar" fica explícita.
  const handleCategoryFilter = useCallback((category: { id: string }) => {
    setSelectedCategoryId((prev) => (prev === category.id ? null : category.id));
  }, []);

  const handleStartReport = useCallback(() => {
    router.push('/report/new');
  }, []);

  const selectedCategoryLabel = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId)?.label,
    [categories, selectedCategoryId]
  );

  const handleReportPress = useCallback((report: { id: string }) => {
    router.push(`/report/${report.id}`);
  }, []);

  const handleMapRegionChange = useCallback((region: typeof mapRegion) => {
    setMapRegion(region);
  }, []);

  if (anonLoading) {
    return <LoadingState message="Preparando o Mapa da Cidade..." />;
  }

  const listHeader = (
    <View>
      {locError ? (
        <View style={styles.locationNotice} accessibilityRole="alert">
          <MaterialCommunityIcons name={ICONS.info} size={20} color={colors.info} />
          <Text style={styles.locationNoticeText}>{locError}</Text>
          <Button
            title="Tentar"
            onPress={getLocation}
            variant="ghost"
            size="small"
            style={styles.locationNoticeAction}
          />
        </View>
      ) : null}

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title} accessibilityRole="header">
            Mapa da Cidade
          </Text>
          <Text style={styles.subtitle}>
            Acompanhe e relate problemas da sua cidade, sem precisar criar conta.
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <MaterialCommunityIcons name={ICONS.inbox} size={16} color={colors.primary} />
          <Text style={styles.headerBadgeText}>Anônimo</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <MaterialCommunityIcons name="camera-outline" size={22} color={colors.onPrimary} />
        <View style={styles.heroText}>
          <Text style={styles.heroTitle} accessibilityRole="header">
            Viu algum problema?
          </Text>
          <Text style={styles.heroSubtitle}>
            Registre em menos de um minuto. A categoria, o local e uma descrição são
            suficientes.
          </Text>
        </View>
        <Button
          title="Registrar problema"
          icon={ICONS.plus}
          onPress={handleStartReport}
          variant="primary"
          size="large"
          style={styles.heroButton}
          accessibilityHint="Abre o formulário para registrar um novo problema"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Categorias
          </Text>
          {selectedCategoryLabel ? (
            <Button
              title="Limpar filtro"
              onPress={() => setSelectedCategoryId(null)}
              variant="ghost"
              size="small"
            />
          ) : null}
        </View>
        <Text style={styles.sectionHint}>
          Toque para ver apenas os problemas desta categoria.
        </Text>

        {catLoading ? (
          <LoadingState message="Carregando categorias..." compact />
        ) : catError ? (
          <ErrorState
            message={catError}
            onRetry={refreshCategories}
            compact
          />
        ) : (
          <CategoryGrid
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onPressCategory={handleCategoryFilter}
          />
        )}
      </View>
    </View>
  );

  const listFooter = (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        Mapa da Cidade · dados de demonstração
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xxl },
        isWide && styles.contentContainerWide,
      ]}
    >
      <View style={styles.column}>{listHeader}</View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            {selectedCategoryLabel ?? 'Problemas próximos'}
            {reports.length > 0 ? (
              <Text style={styles.count}>{`  ${reports.length}`}</Text>
            ) : null}
          </Text>

          <View style={styles.viewToggle} accessibilityRole="tablist">
            <ToggleButton
              icon={ICONS.list}
              label="Lista"
              active={!showMap}
              onPress={() => setShowMap(false)}
            />
            <ToggleButton
              icon={ICONS.map}
              label="Mapa"
              active={showMap}
              onPress={() => setShowMap(true)}
            />
          </View>
        </View>

        {showMap ? (
          <View style={styles.mapContainer}>
            {reportsLoading ? (
              <LoadingState message="Carregando mapa..." />
            ) : reportsError ? (
              <ErrorState message={reportsError} onRetry={refreshReports} />
            ) : (
              <MapViewComponent
                reports={reports}
                region={mapRegion}
                onRegionChange={handleMapRegionChange}
                onPressMarker={handleReportPress}
                categoryFilter={selectedCategoryId || undefined}
                categoryFilterLabel={selectedCategoryLabel}
                userLocation={userLocation}
                style={styles.map}
              />
            )}
          </View>
        ) : reportsLoading ? (
          <LoadingState message="Carregando problemas..." />
        ) : reportsError ? (
          <ErrorState message={reportsError} onRetry={refreshReports} />
        ) : reports.length > 0 ? (
          <View style={styles.cards}>
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onPress={() => handleReportPress(report)}
                userLocation={userLocation}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="map-search-outline"
            title="Nenhum problema por perto"
            description={
              selectedCategoryLabel
                ? `Não há registros de ${selectedCategoryLabel.toLowerCase()} em um raio de 5 km. Tente outra categoria ou registre o primeiro.`
                : 'Não há registros num raio de 5 km ao seu redor. Seja o primeiro a relato o que está acontecendo.'
            }
            actionLabel="Registrar problema"
            onAction={handleStartReport}
            secondaryActionLabel={
              selectedCategoryId ? 'Ver todas as categorias' : undefined
            }
            onSecondaryAction={
              selectedCategoryId ? () => setSelectedCategoryId(null) : undefined
            }
            compact
          />
        )}
      </View>

      {listFooter}
    </ScrollView>
  );
}

/** Alternador lista/mapa — o estado ativo fica óbvio por cor + peso + ícone. */
function ToggleButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: IconName;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      title={label}
      icon={icon}
      onPress={onPress}
      variant={active ? 'secondary' : 'ghost'}
      size="small"
      style={[styles.toggleButton, active && styles.toggleButtonActive]}
      accessibilityHint={`Alterna a visualização para ${label.toLowerCase()}`}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: spacing.xxl,
  },
  contentContainerWide: {
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },

  locationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.infoSoft,
    borderWidth: 1,
    borderColor: colors.infoBorder,
  },
  locationNoticeText: {
    flex: 1,
    fontSize: fontSize.small,
    color: colors.textSecondary,
    lineHeight: fontSize.small * lineHeight.snug,
  },
  locationNoticeAction: {
    minHeight: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.base,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.text,
    lineHeight: fontSize.display * lineHeight.tight,
  },
  subtitle: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: fontSize.small * lineHeight.snug,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  headerBadgeText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },

  hero: {
    marginHorizontal: spacing.base,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    gap: spacing.md,
  },
  heroText: {
    gap: spacing.xxs,
  },
  heroTitle: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.onPrimary,
  },
  heroSubtitle: {
    fontSize: fontSize.small,
    color: palette.blue100,
    lineHeight: fontSize.small * lineHeight.snug,
  },
  heroButton: {
    alignSelf: 'stretch',
  },

  section: {
    marginTop: spacing.xl,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
    flexShrink: 1,
  },
  count: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  sectionHint: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },

  viewToggle: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xxs,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSunken,
  },
  toggleButton: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  toggleButtonActive: {
    backgroundColor: colors.surface,
  },

  mapContainer: {
    // Na web o mapa vira lista de cartões: 320px esconderia os itens.
    height: Platform.OS === 'web' ? 520 : layout.mapHeight,
    marginHorizontal: spacing.base,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapContainerWide: {
    marginHorizontal: 0,
  },
  map: {
    flex: 1,
  },

  cards: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    gap: spacing.md,
  },

  footer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.base,
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
});