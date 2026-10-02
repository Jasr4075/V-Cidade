import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';
import { Coordinates, getCurrentLocation, reverseGeocode } from '@/services/location/location';
import { MaterialCommunityIcons, ICONS, colors, radii, spacing, fontSize, fontWeight, lineHeight, shadow, HIT_SIZE } from '@/theme';
/**
 * Respaldo de seleção de localização para web.
 *
 * `react-native-maps` é nativo (Android/iOS) e incompatível com react-native-web
 * (usa `codegenNativeComponent`, removido no RN-W 0.21.x). O Expo resolve
 * `LocationPicker.native.tsx` nos dispositivos e este arquivo (`.web.tsx`) no
 * navegador, sem nunca importar `react-native-maps`.
 *
 * Mesma API da versão nativa: cabeçalho e CTA ficam dentro do componente, então
 * a tela não desenha cabeçalho nem botão duplicados.
 */
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

function parseCoordinate(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export const LocationPicker = ({
  initialLocation,
  onLocationSelect,
  title = 'Onde está o problema?',
  subtitle = 'Informe as coordenadas, ou use a sua localização atual.',
  categoryLabel,
  stepLabel = 'ETAPA 2 DE 4',
  onBack,
  ctaLabel = 'Continuar',
  ctaDisabledLabel = 'Informe as coordenadas',
  onContinue,
}: LocationPickerProps) => {

  const responsive = useResponsive();
  const pad = responsive.gutter;

  const [latStr, setLatStr] = useState(
    initialLocation ? String(initialLocation.latitude) : ''
  );
  const [lngStr, setLngStr] = useState(
    initialLocation ? String(initialLocation.longitude) : ''
  );
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedLat = parseCoordinate(latStr);
  const selectedLng = parseCoordinate(lngStr);

  // Validação de faixa: impede gravar coordenadas sem sentido (ex.: 999).
  const latValid = selectedLat !== null && selectedLat >= -90 && selectedLat <= 90;
  const lngValid = selectedLng !== null && selectedLng >= -180 && selectedLng <= 180;
  const hasSelection = latValid && lngValid;

  const handleUseCurrentLocation = useCallback(async () => {
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      if (!location) return;
      setLatStr(location.latitude.toFixed(6));
      setLngStr(location.longitude.toFixed(6));
      setAddress(await reverseGeocode(location.latitude, location.longitude));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLookup = useCallback(async () => {
    if (!hasSelection) return;
    setLoading(true);
    try {
      setAddress(await reverseGeocode(selectedLat!, selectedLng!));
    } finally {
      setLoading(false);
    }
  }, [hasSelection, selectedLat, selectedLng]);

  const handleContinue = useCallback(() => {
    if (!hasSelection) return;
    onLocationSelect({ latitude: selectedLat!, longitude: selectedLng! }, address);
    onContinue?.();
  }, [hasSelection, selectedLat, selectedLng, address, onLocationSelect, onContinue]);

  const addressText = loading
    ? 'Buscando endereço...'
    : address || 'O endereço aparece depois que você informar o local.';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        {
          width: '100%',
          maxWidth: responsive.maxContentWidth + pad * 2,
          alignSelf: 'center',
          paddingLeft: pad,
          paddingRight: pad,
        },
        styles.content,
        {
          paddingTop: responsive.topInset + spacing.sm,
          paddingBottom: responsive.bottomInset + spacing.xxl,
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
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
          <Text style={styles.step}>{stepLabel}</Text>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {categoryLabel ? (
            <View style={styles.categoryBadge}>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.primary} />
              <Text style={styles.categoryLabel}>{categoryLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.notice}>
        <MaterialCommunityIcons name={ICONS.info} size={20} color={colors.info} />
        <Text style={styles.noticeText}>
          No navegador o mapa interativo não está disponível. Informe as coordenadas do
          problema — no celular você toca direto no mapa.
        </Text>
      </View>

      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.form}>
        <View style={responsive.isMobile ? styles.column : styles.row}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel} nativeID="lat-label">
              Latitude
            </Text>
            <TextInput
              style={[
                styles.input,
                latStr.length > 0 && !latValid && styles.inputInvalid,
              ]}
              value={latStr}
              onChangeText={setLatStr}
              placeholder="-23,550500"
              placeholderTextColor={colors.textDisabled}
              inputMode="decimal"
              accessibilityLabel="Latitude"
              accessibilityLabelledBy="lat-label"
            />
            {latStr.length > 0 && !latValid ? (
              <Text style={styles.fieldError}>Use um valor entre -90 e 90.</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel} nativeID="lng-label">
              Longitude
            </Text>
            <TextInput
              style={[
                styles.input,
                lngStr.length > 0 && !lngValid && styles.inputInvalid,
              ]}
              value={lngStr}
              onChangeText={setLngStr}
              placeholder="-46,633300"
              placeholderTextColor={colors.textDisabled}
              inputMode="decimal"
              accessibilityLabel="Longitude"
              accessibilityLabelledBy="lng-label"
            />
            {lngStr.length > 0 && !lngValid ? (
              <Text style={styles.fieldError}>Use um valor entre -180 e 180.</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.addressBar}>
          <MaterialCommunityIcons
            name={hasSelection ? 'check-circle' : ICONS.map}
            size={20}
            color={hasSelection ? colors.success : colors.textMuted}
          />
          {loading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          <Text style={[styles.addressText, hasSelection && styles.addressTextSet]}>
            {addressText}
          </Text>
        </View>

        <Pressable
          onPress={handleLookup}
          disabled={!hasSelection || loading}
          accessibilityRole="button"
          accessibilityLabel="Buscar endereço dessas coordenadas"
          style={({ pressed }: { pressed: boolean }) => [
            styles.lookupButton,
            !hasSelection && styles.lookupDisabled,
            pressed && hasSelection && styles.lookupPressed,
          ]}
        >
          <Text style={[styles.lookupText, !hasSelection && styles.lookupTextDisabled]}>
            Buscar endereço
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={handleUseCurrentLocation}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Usar minha localização atual"
        style={({ pressed }: { pressed: boolean }) => [
          styles.currentLocation,
          pressed && styles.currentLocationPressed,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <MaterialCommunityIcons name={ICONS.myLocation} size={20} color={colors.primary} />
        )}
        <Text style={styles.currentLocationText}>
          {loading ? 'Obtendo localização...' : 'Usar minha localização atual'}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleContinue}
        disabled={!hasSelection}
        accessibilityRole="button"
        accessibilityState={{ disabled: !hasSelection }}
        accessibilityLabel={hasSelection ? ctaLabel : ctaDisabledLabel}
        style={({ pressed }: { pressed: boolean }) => [
          styles.cta,
          !hasSelection && styles.ctaDisabled,
          pressed && hasSelection && styles.ctaPressed,
        ]}
      >
        <Text style={[styles.ctaText, !hasSelection && styles.ctaTextDisabled]}>
          {hasSelection ? ctaLabel : ctaDisabledLabel}
        </Text>
        <MaterialCommunityIcons
          name="arrow-right"
          size={22}
          color={hasSelection ? colors.onPrimary : colors.textDisabled}
        />
      </Pressable>
    </ScrollView>
  );
};

LocationPicker.displayName = 'LocationPicker';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.lg,
    gap: spacing.base,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconButton: {
    width: HIT_SIZE,
    height: HIT_SIZE,
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

  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.infoSoft,
    borderWidth: 1,
    borderColor: colors.infoBorder,
  },
  noticeText: {
    flex: 1,
    fontSize: fontSize.small,
    color: colors.textSecondary,
    lineHeight: fontSize.small * lineHeight.snug,
  },
  subtitle: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    lineHeight: fontSize.small * lineHeight.snug,
  },

  form: {
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  // No celular os dois campos empilham: lado a lado sobrariam ~130px para
  // cada coordenada, e o erro de digitação com sinal e 6 casas é comum.
  column: {
    gap: spacing.md,
  },
  field: {
    flex: 1,
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.body,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputInvalid: {
    borderColor: colors.danger,
  },
  fieldError: {
    fontSize: fontSize.caption,
    color: colors.danger,
  },

  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressText: {
    flex: 1,
    fontSize: fontSize.small,
    color: colors.textMuted,
    lineHeight: fontSize.small * lineHeight.snug,
  },
  addressTextSet: {
    color: colors.text,
    fontWeight: fontWeight.medium,
  },

  lookupButton: {
    minHeight: HIT_SIZE,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
  },
  lookupDisabled: {
    backgroundColor: colors.surfaceSunken,
    borderColor: colors.border,
  },
  lookupPressed: {
    backgroundColor: colors.primaryBorder,
  },
  lookupText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  lookupTextDisabled: {
    color: colors.textDisabled,
  },

  currentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: HIT_SIZE,
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