import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Platform, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coordinates, getCurrentLocation, reverseGeocode } from '@/services/location/location';
import { useMapReady } from '@/hooks/useMapReady';
import { MaterialCommunityIcons, ICONS, colors, radii, spacing, fontSize, fontWeight, lineHeight, shadow, layout } from '@/theme';

const MAP_PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;
interface LocationPickerProps {
  initialLocation?: Coordinates;
  onLocationSelect: (location: Coordinates, address: string) => void;
  title?: string;
  subtitle?: string;
  categoryLabel?: string;
  stepLabel?: string;
  onBack?: () => void;
  ctaLabel?: string;
  ctaDisabledLabel?: string;
  onContinue?: () => void;
}

/**
 * Seleção de local no mapa.
 *
 * O componente é dono do cabeçalho e do botão de continuar para que a etapa
 * tenha um único caminho de saída visível — duas CTAs na mesma tela fazem o
 * usuário hesitar entre elas.
 */
export const LocationPicker = ({
  initialLocation,
  onLocationSelect,
  title = 'Onde está o problema?',
  subtitle = 'Toque no mapa para marcar o local, ou use a sua localização atual.',
  categoryLabel,
  stepLabel = 'ETAPA 2 DE 4',
  onBack,
  ctaLabel = 'Continuar',
  ctaDisabledLabel = 'Escolha um local no mapa',
  onContinue,
}: LocationPickerProps) => {
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const [region, setRegion] = useState({
    latitude: initialLocation?.latitude ?? -23.5505,
    longitude: initialLocation?.longitude ?? -46.6333,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selected, setSelected] = useState<Coordinates | null>(initialLocation ?? null);
  const [address, setAddress] = useState('');
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const { mapFailed, handleMapReady } = useMapReady();

  const reportSelection = useCallback(
    async (coords: Coordinates) => {
      setResolving(true);
      const resolved = await reverseGeocode(coords.latitude, coords.longitude);
      setAddress(resolved);
      setResolving(false);
      onLocationSelect(coords, resolved);
    },
    [onLocationSelect]
  );

  useEffect(() => {
    if (initialLocation) {
      setSelected(initialLocation);
      reverseGeocode(initialLocation.latitude, initialLocation.longitude).then(setAddress);
    }
  }, [initialLocation]);

  const handleMapPress = useCallback(
    (event: { nativeEvent: { coordinate: Coordinates } }) => {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      const next = { latitude, longitude };
      setSelected(next);
      void reportSelection(next);
    },
    [reportSelection]
  );

  const handleUseCurrentLocation = useCallback(async () => {
    setLocating(true);
    try {
      const location = await getCurrentLocation();
      if (!location) return;

      setSelected(location);
      const nextRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 400);
      await reportSelection(location);
    } finally {
      setLocating(false);
    }
  }, [reportSelection]);

  const addressText = resolving
    ? 'Buscando endereço...'
    : address || 'Nenhum local selecionado ainda';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={8}
            style={({ pressed }: { pressed: boolean }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <MaterialCommunityIcons name={ICONS.back} size={24} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}

        <View style={styles.headerText}>
          {stepLabel ? <Text style={styles.step}>{stepLabel}</Text> : null}
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {categoryLabel ? (
            <View style={styles.categoryBadge}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={14}
                color={colors.primary}
              />
              <Text style={styles.categoryLabel}>{categoryLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.addressBar}>
        <MaterialCommunityIcons
          name={selected ? 'check-circle' : ICONS.map}
          size={20}
          color={selected ? colors.success : colors.textMuted}
        />
        <View style={styles.addressText}>
          {resolving ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          <Text
            style={[styles.addressLabel, selected ? styles.addressLabelSet : undefined]}
            accessibilityLabel={selected ? `Endereço: ${addressText}` : 'Nenhum local selecionado'}
          >
            {addressText}
          </Text>
        </View>
      </View>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={MAP_PROVIDER}
          initialRegion={region}
          onMapReady={handleMapReady}
          loadingEnabled
          onRegionChange={setRegion}
          onPress={handleMapPress}
          showsUserLocation
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
        >
          {selected ? (
            <Marker coordinate={selected} tracksViewChanges={false} anchor={{ x: 0.5, y: 1 }}>
              <View style={styles.marker} accessibilityLabel="Local selecionado">
                <MaterialCommunityIcons name="map-marker" size={36} color={colors.primary} />
                <View style={styles.markerDot} />
              </View>
            </Marker>
          ) : null}
        </MapView>

        {!selected && !mapFailed ? (
          <View style={styles.hintOverlay} pointerEvents="none">
            <MaterialCommunityIcons name={ICONS.myLocation} size={18} color={colors.primary} />
            <Text style={styles.hintText}>Toque no mapa para marcar</Text>
          </View>
        ) : null}

        {mapFailed ? (
          <View style={styles.mapFailed} pointerEvents="none">
            <MaterialCommunityIcons name="map-outline" size={26} color={colors.textSecondary} />
            <Text style={styles.mapFailedTitle}>Mapa indisponível</Text>
            <Text style={styles.mapFailedText}>
              Use “Usar minha localização atual” ou toque no mapa para marcar o ponto.
            </Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.base }]}>
        <Pressable
          onPress={handleUseCurrentLocation}
          disabled={locating}
          accessibilityRole="button"
          accessibilityLabel="Usar minha localização atual"
          style={({ pressed }: { pressed: boolean }) => [
            styles.currentLocation,
            pressed && styles.currentLocationPressed,
          ]}
        >
          {locating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MaterialCommunityIcons name={ICONS.myLocation} size={20} color={colors.primary} />
          )}
          <Text style={styles.currentLocationText}>
            {locating ? 'Obtendo localização...' : 'Usar minha localização atual'}
          </Text>
        </Pressable>

        <Pressable
          onPress={onContinue}
          disabled={!selected}
          accessibilityRole="button"
          accessibilityState={{ disabled: !selected }}
          accessibilityLabel={selected ? ctaLabel : ctaDisabledLabel}
          style={({ pressed }: { pressed: boolean }) => [
            styles.cta,
            !selected && styles.ctaDisabled,
            pressed && selected && styles.ctaPressed,
          ]}
        >
          <Text style={[styles.ctaText, !selected && styles.ctaTextDisabled]}>
            {selected ? ctaLabel : ctaDisabledLabel}
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={22}
            color={selected ? colors.onPrimary : colors.textDisabled}
          />
        </Pressable>
      </View>
    </View>
  );
};

LocationPicker.displayName = 'LocationPicker';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconButtonPressed: {
    backgroundColor: colors.surfaceSunken,
  },
  headerText: {
    flex: 1,
    gap: spacing.xxs,
  },
  step: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: fontSize.headline,
    fontWeight: fontWeight.bold,
    color: colors.text,
    lineHeight: fontSize.headline * lineHeight.tight,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.xxs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  categoryLabel: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  subtitle: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    lineHeight: fontSize.small * lineHeight.snug,
    paddingHorizontal: spacing.base,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },

  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  addressText: {
    flex: 1,
    gap: spacing.xxs,
  },
  addressLabel: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    lineHeight: fontSize.small * lineHeight.snug,
  },
  addressLabelSet: {
    color: colors.text,
    fontWeight: fontWeight.medium,
  },

  mapWrap: {
    flex: 1,
    marginHorizontal: spacing.base,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: {
    flex: 1,
  },
  marker: {
    alignItems: 'center',
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: -4,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  hintOverlay: {
    position: 'absolute',
    top: spacing.base,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    ...shadow.md,
  },
  hintText: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  mapFailed: {
    position: 'absolute',
    top: spacing.base,
    left: spacing.base,
    right: spacing.base,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.base,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.md,
  },
  mapFailedTitle: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  mapFailedText: {
    fontSize: fontSize.caption,
    lineHeight: fontSize.caption * lineHeight.snug,
    textAlign: 'center',
    color: colors.textSecondary,
  },

  footer: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    gap: spacing.sm,
  },
  currentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
  },
  currentLocationPressed: {
    backgroundColor: colors.primarySoft,
  },
  currentLocationText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 56,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  ctaPressed: {
    backgroundColor: colors.primaryPressed,
  },
  ctaDisabled: {
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaText: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.onPrimary,
  },
  ctaTextDisabled: {
    color: colors.textDisabled,
  },
});