import React, { useMemo } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { Report } from '@/types';
import { useMapReady } from '@/hooks/useMapReady';
import { MapMarker } from './MapMarker';
import { MaterialCommunityIcons, ICONS, colors, radii, spacing, fontSize, fontWeight, shadow, palette } from '@/theme';

/**
 * No Android o Google Maps é o único provider e não exige provider explícito,
 * mas declará-lo deixa a intenção clara. No iOS mantemos o Apple Maps, que não
 * precisa de chave nem de billing — forçar o Google exigiria GOOGLE_MAPS_IOS_API_KEY.
 */
const MAP_PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;
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
    region,
    onRegionChange,
    onPressMarker,
    selectedReportId,
    categoryFilter,
    categoryFilterLabel,
    showUserLocation = true,
    userLocation,
    style,
  }: MapViewProps) => {
    const filteredReports = useMemo(
      () => (categoryFilter ? reports.filter((r) => r.category_id === categoryFilter) : reports),
      [reports, categoryFilter]
    );

    const groups = useMemo(() => groupReportsByLocation(filteredReports), [filteredReports]);

    const { mapFailed, handleMapReady } = useMapReady();

    const selected = useMemo(
      () => (selectedReportId ? filteredReports.find((r) => r.id === selectedReportId) : undefined),
      [filteredReports, selectedReportId]
    );

    return (
      <View style={[styles.container, style]}>
        <MapView
          style={styles.map}
          provider={MAP_PROVIDER}
          initialRegion={region}
          onMapReady={handleMapReady}
          loadingEnabled
          onRegionChangeComplete={onRegionChange}
          showsUserLocation={showUserLocation}
          showsMyLocationButton
          showsCompass={false}
          rotateEnabled={false}
          pitchEnabled={false}
          maxZoomLevel={18}
          minZoomLevel={10}
        >
          {userLocation && showUserLocation ? (
            <Marker coordinate={userLocation} title="Sua localização" description="Você está aqui">
              <View style={styles.userLocationMarker}>
                <View style={styles.userLocationCore} />
              </View>
            </Marker>
          ) : null}

          {groups.map((group) => {
            const groupSelected = group.reports.some((r) => r.id === selectedReportId);
            return (
              <Marker
                key={`${group.latitude}-${group.longitude}`}
                coordinate={{ latitude: group.latitude, longitude: group.longitude }}
                onPress={() => onPressMarker(group.reports[0])}
                tracksViewChanges={false}
              >
                <MapMarker
                  status={group.reports[0].status}
                  count={group.reports.length}
                  selected={groupSelected}
                />
              </Marker>
            );
          })}
        </MapView>

        {mapFailed ? (
          <View style={styles.mapFailed} pointerEvents="none">
            <MaterialCommunityIcons name="map-outline" size={28} color={colors.textSecondary} />
            <Text style={styles.mapFailedTitle}>O mapa não carregou</Text>
            <Text style={styles.mapFailedText}>
              Sem internet ou sem acesso ao Google Maps. Os avisos ainda estão listados abaixo.
            </Text>
          </View>
        ) : null}

        {categoryFilter ? (
          <View style={styles.filterBadge}>
            <MaterialCommunityIcons name={ICONS.filter} size={16} color={colors.primary} />
            <Text style={styles.filterBadgeText} numberOfLines={1}>
              {categoryFilterLabel || 'Filtrado por categoria'}
            </Text>
          </View>
        ) : null}

        {selected?.location ? (
          <View style={styles.countHint} pointerEvents="none">
            <MaterialCommunityIcons name={ICONS.info} size={14} color={colors.textSecondary} />
            <Text style={styles.countHintText}>
              {filteredReports.length}{' '}
              {filteredReports.length === 1 ? 'problema visível' : 'problemas visíveis'}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }
);

MapViewComponent.displayName = 'MapViewComponent';

interface Group {
  latitude: number;
  longitude: number;
  reports: Report[];
}

/** Agrupa registros próximos para o mapa não virar um amontoado de pinos. */
function groupReportsByLocation(reports: Report[], threshold = 0.0005): Group[] {
  const groups: Group[] = [];

  for (const report of reports) {
    if (!report.location) continue;
    const [longitude, latitude] = report.location.coordinates;
    const group = groups.find(
      (g) =>
        Math.abs(g.latitude - latitude) < threshold && Math.abs(g.longitude - longitude) < threshold
    );

    if (group) group.reports.push(report);
    else groups.push({ latitude, longitude, reports: [report] });
  }

  return groups;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  map: {
    flex: 1,
  },
  userLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  userLocationCore: {
    width: 6,
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  filterBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    shadowColor: palette.gray900,
    ...(shadow.md as object),
  },
  filterBadgeText: {
    flex: 1,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  countHint: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countHintText: {
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
  mapFailed: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -140 }, { translateY: -60 }],
    width: 280,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.base,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...(shadow.md as object),
  },
  mapFailedTitle: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  mapFailedText: {
    fontSize: fontSize.caption,
    lineHeight: fontSize.caption * 1.4,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});