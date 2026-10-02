import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useCategories, useAnonymousId, useNearbyReports } from '@/hooks/useReports';
import { useLocation } from '@/hooks/useLocation';
import { useResponsive } from '@/hooks/useResponsive';
import { CategoryGrid } from '@/components/CategoryGrid';
import { ReportCard } from '@/components/ReportCard';
import { MapViewComponent, MAP_REQUIRES_FIXED_HEIGHT } from '@/components/MapView';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Button } from '@/components/Button';
import { DEFAULT_MAP_REGION } from '@/constants';
import { GRID_ITEM_MIN_WIDTH, columnWidthPercent } from '@/theme';
import { MaterialCommunityIcons, ICONS, type IconName, colors, palette, radii, spacing, fontSize, fontWeight, lineHeight } from '@/theme';

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

  const responsive = useResponsive();

  // A margem lateral acompanha o viewport (com teto), em vez de um `16`
  // fixo que fica apertado no celular e desperdiçado no ultrawide.
  const pad = responsive.gutter;
  const columnWidth = responsive.maxContentWidth;
  const contentPadding = useMemo(
    () => ({
      paddingLeft: pad,
      paddingRight: pad,
      maxWidth: columnWidth + pad * 2,
      alignSelf: 'center' as const,
      width: '100%' as const,
    }),
    [pad, columnWidth]
  );

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
    return <LoadingState message="Preparando o vCidade..." />;
  }

  // No desktop o mapa divide a tela com a lista em vez de empurrá-la para
  // baixo — é o ganho de espaço mais visível em telas grandes.
  const splitView = showMap && responsive.isLarge;

  const mapBody = reportsLoading ? (
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
  );

  const reportsBody = reportsLoading ? (
    <LoadingState message="Carregando problemas..." />
  ) : reportsError ? (
    <ErrorState message={reportsError} onRetry={refreshReports} />
  ) : reports.length > 0 ? (
    <ReportGrid
      reports={reports}
      columns={
        responsive.isMobile
          ? 1
          : responsive.columnsFor(columnWidth, GRID_ITEM_MIN_WIDTH.reportCard, spacing.md)
      }
      onPressReport={handleReportPress}
      userLocation={userLocation}
    />
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
      secondaryActionLabel={selectedCategoryId ? 'Ver todas as categorias' : undefined}
      onSecondaryAction={
        selectedCategoryId ? () => setSelectedCategoryId(null) : undefined
      }
      compact
    />
  );

  const listHeader = (
    <View style={contentPadding}>
      {locError ? (
        <View style={styles.locationNotice} accessibilityRole="alert">
          <MaterialCommunityIcons name={ICONS.info} size={20} color={colors.info} />
          <Text style={styles.locationNoticeText}>{locError}</Text>
          <Button
            title="Tentar"
            onPress={getLocation}
            variant="ghost"
            size="small"
          />
        </View>
      ) : null}

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title} accessibilityRole="header">
            vCidade
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

      <View
        style={[
          styles.hero,
          responsive.isLarge && styles.heroRow,
        ]}
      >
        <View style={[styles.heroText, responsive.isLarge && styles.heroTextRow]}>
          <View style={styles.heroHeading}>
            <MaterialCommunityIcons
              name="camera-outline"
              size={22}
              color={colors.onPrimary}
            />
            <Text style={styles.heroTitle} accessibilityRole="header">
              Viu algum problema?
            </Text>
          </View>
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
          style={responsive.isLarge ? styles.heroButtonRow : styles.heroButton}
          accessibilityHint="Abre o formulário para registrar um novo problema"
        />
      </View>

      <View style={styles.sectionTight}>
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
          <ErrorState message={catError} onRetry={refreshCategories} compact />
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
    <View style={[styles.footer, contentPadding]}>
      <Text style={styles.footerText}>vCidade · dados de demonstração</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      contentContainerStyle={{
        paddingTop: responsive.topInset + spacing.sm,
        paddingBottom: responsive.bottomInset + spacing.xxl,
      }}
    >
      {listHeader}

      <View
        style={[
          styles.section,
          contentPadding,
          splitView && styles.splitView,
        ]}
      >
        <View style={[styles.sectionHeader, splitView && styles.sectionHeaderSplit]}>
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
          <View
            style={[
              splitView ? styles.splitPane : styles.mapBlock,
              // Altura fixa só onde o mapa realmente precisa dela. O fallback
              // web cresce com a lista e ficaria cortado se fosse preso numa
              // caixa de altura fixa.
              MAP_REQUIRES_FIXED_HEIGHT && { height: responsive.mapHeight },
              styles.mapSurface,
            ]}
          >
            {mapBody}
          </View>
        ) : null}

        <View style={splitView ? styles.splitPane : undefined}>{reportsBody}</View>
      </View>

      {listFooter}
    </ScrollView>
  );
}

/**
 * Grid de ocorrências. O número de colunas vem do espaço real disponível,
 * então a mesma lista rende uma coluna no celular e 2–3 no desktop sem que a
 * tela precise saber sobre `Platform.OS`.
 */
function ReportGrid({
  reports,
  columns,
  onPressReport,
  userLocation,
}: {
  reports: Parameters<typeof ReportCard>[0]['report'][];
  columns: number;
  onPressReport: (report: { id: string }) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}) {
  const widthPercent = columnWidthPercent(columns);

  return (
    <View style={styles.cards}>
      {reports.map((report) => (
        <View
          key={report.id}
          style={{
            width: widthPercent,
            // O vão sai do padding do próprio item, então não é preciso
            // `calc()` — que nem existe no Yoga.
            paddingRight: columns > 1 ? spacing.md : 0, marginBottom: spacing.md,
          }}
        >
          <ReportCard
            report={report}
            onPress={() => onPressReport(report)}
            userLocation={userLocation}
          />
        </View>
      ))}
    </View>
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

  locationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.base,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
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
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    gap: spacing.md,
  },
  // Em telas grandes o texto ocupa o espaço e o botão vira um alvo à direita,
  // em vez de uma barra gigante ocupando a linha inteira.
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  heroText: {
    gap: spacing.xxs,
  },
  heroTextRow: {
    flex: 1,
    minWidth: 0,
  },
  heroHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  heroButtonRow: {
    flexShrink: 0,
  },

  section: {
    marginTop: spacing.xl,
    flexDirection: 'column',
  },
  sectionTight: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  // Na visão dividida, o cabeçalho acompanha apenas a coluna da lista.
  sectionHeaderSplit: {
    alignSelf: 'flex-start',
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
    paddingHorizontal: spacing.md,
  },
  toggleButtonActive: {
    backgroundColor: colors.surface,
  },

  splitView: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.lg,
    rowGap: spacing.lg,
    alignItems: 'flex-start',
  },
  splitPane: {
    // 560px evita que uma coluna fique estreita demais para o card na outra.
    flexGrow: 1,
    flexBasis: 320,
    minWidth: 0,
  },
  mapBlock: {
    marginBottom: spacing.lg,
  },
  mapSurface: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  map: {
    flex: 1,
  },

  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: spacing.md,
  },

  footer: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.base,
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
});
