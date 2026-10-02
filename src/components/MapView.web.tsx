import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Report } from '@/types';
import { formatRelativeTime } from '@/utils';
import { getStatusPalette, MaterialCommunityIcons, ICONS, getCategoryIcon, STATUS_ICONS, colors, radii, spacing, fontSize, fontWeight, lineHeight, HIT_SIZE } from '@/theme';
import { GRID_ITEM_MIN_WIDTH, columnWidthPercent } from '@/theme/breakpoints';
import { useResponsive } from '@/hooks/useResponsive';
import { STATUS_LABELS } from '@/constants';

/**
 * Respaldo de mapa para a plataforma web.
 *
 * `react-native-maps` é nativo (Android/iOS) e não funciona com
 * react-native-web. O Metro resolve `MapView.native.tsx` no celular e este
 * arquivo (`.web.tsx`) no navegador, sem nunca importar `react-native-maps`.
 *
 * Em vez de sumir com a informação, a web mostra os mesmos problemas em uma
 * lista navegável: um mapa em branco seria perda de funcionalidade.
 *
 * Esta lista cresce com o conteúdo (não tem altura fixa nem scroll próprio):
 * quem controla a rolagem é a tela que a hospeda. Ver `MAP_REQUIRES_FIXED_HEIGHT`.
 */

/**
 * A web NÃO precisa de altura fixa — o componente cresce com o conteúdo.
 * O mapa nativo, sim, porque o Google Maps exige uma caixa com tamanho definido.
 * A tela lê este sinal para não trancar a lista numa janela de 520px.
 */
export const MAP_REQUIRES_FIXED_HEIGHT = false;

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapViewProps {
  reports: Report[];
  region: Region;
  onRegionChange: (region: Region) => void;
  onPressMarker: (report: Report) => void;
  selectedReportId?: string;
  categoryFilter?: string;
  categoryFilterLabel?: string;
  showUserLocation?: boolean;
  userLocation?: { latitude: number; longitude: number } | null;
  style?: object;
}

export const MapViewComponent = React.memo(
  ({
    reports,
    onPressMarker,
    selectedReportId,
    categoryFilter,
    categoryFilterLabel,
    style,
  }: MapViewProps) => {
    const responsive = useResponsive();

    const filteredReports = useMemo(
      () => (categoryFilter ? reports.filter((r) => r.category_id === categoryFilter) : reports),
      [reports, categoryFilter]
    );

    // Em telas médias a lista vira 2 colunas e em desktop 2–3, para não
    // transformar o painel do mapa numa coluna quilométrica.
    const contentWidth = Math.max(240, responsive.width - responsive.horizontalPadding * 2);
    const columns = responsive.isMobile
      ? 1
      : responsive.columnsFor(contentWidth, GRID_ITEM_MIN_WIDTH.compactCard, spacing.md);
    const cardWidth = columnWidthPercent(columns);
    const cardSpacer = spacing.md;

    return (
      <View style={[styles.container, style]}>
        <View style={styles.notice}>
          <MaterialCommunityIcons name={ICONS.map} size={18} color={colors.info} />
          <Text style={styles.noticeText}>
            O mapa interativo fica disponível no app para Android e iOS. Aqui você vê a mesma
            lista de problemas abaixo.
          </Text>
        </View>

        {categoryFilter ? (
          <View style={styles.filterBadge}>
            <MaterialCommunityIcons name={ICONS.filter} size={16} color={colors.primary} />
            <Text style={styles.filterBadgeText} numberOfLines={1}>
              {categoryFilterLabel || 'Filtrado por categoria'}
            </Text>
          </View>
        ) : null}

        {filteredReports.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name={ICONS.empty} size={32} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {categoryFilter
                ? 'Nenhum problema nesta categoria por perto'
                : 'Nenhum problema encontrado por perto'}
            </Text>
            <Text style={styles.emptyBody}>
              Volte mais tarde ou registre um problema novo.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredReports.map((report) => {
              const selected = report.id === selectedReportId;
              const tone = getStatusPalette(report.status);

              return (
                <View
                  key={report.id}
                  style={{
                    width: cardWidth,
                    paddingRight: reportIndexIsLast(filteredReports, report) ? 0 : cardSpacer,
                  }}
                >
                  <Pressable
                    onPress={() => onPressMarker(report)}
                    accessibilityRole="button"
                    accessibilityLabel={`${report.title}, ${report.supports_count || 0} apoios`}
                    accessibilityState={{ selected }}
                    style={({ pressed }: { pressed: boolean }) => [
                      styles.card,
                      selected && styles.cardSelected,
                      pressed && !selected && styles.cardPressed,
                    ]}
                  >
                    <View style={[styles.cardIcon, { backgroundColor: tone.bg }]}>
                      <MaterialCommunityIcons
                        name={getCategoryIcon(report.category?.slug)}
                        size={18}
                        color={tone.fg}
                      />
                    </View>

                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {report.title}
                      </Text>
                      {report.description ? (
                        <Text style={styles.cardDescription} numberOfLines={2}>
                          {report.description}
                        </Text>
                      ) : null}
                      <View style={styles.cardMetaRow}>
                        <View style={styles.metaItem}>
                          <MaterialCommunityIcons
                            name={STATUS_ICONS[report.status]}
                            size={14}
                            color={tone.fg}
                          />
                          <Text style={styles.cardMeta}>
                            {STATUS_LABELS[report.status] || report.status}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <MaterialCommunityIcons name={ICONS.clock} size={14} color={colors.textMuted} />
                          <Text style={styles.cardMeta}>
                            {formatRelativeTime(report.created_at)}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <MaterialCommunityIcons
                            name={ICONS.thumbUp}
                            size={14}
                            color={colors.textMuted}
                          />
                          <Text style={styles.cardMeta}>{report.supports_count || 0}</Text>
                        </View>
                      </View>
                    </View>

                    <MaterialCommunityIcons
                      name={ICONS.chevronRight}
                      size={20}
                      color={colors.textMuted}
                    />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  }
);

MapViewComponent.displayName = 'MapViewComponent';

/** Evita padding à direita na última linha do grid. */
function reportIndexIsLast(reports: Report[], report: Report): boolean {
  return reports[reports.length - 1]?.id === report.id;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.infoSoft,
    borderWidth: 1,
    borderColor: colors.infoBorder,
  },
  noticeText: {
    flex: 1,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    lineHeight: fontSize.caption * lineHeight.snug,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  filterBadgeText: {
    flexShrink: 1,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.base,
  },
  emptyTitle: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: HIT_SIZE + 24,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  cardPressed: {
    backgroundColor: colors.surfaceSunken,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  cardDescription: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardMeta: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
});
