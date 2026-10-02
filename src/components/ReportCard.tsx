import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Report } from '@/types';
import { formatDistance, formatRelativeTime } from '@/utils';
import {
  MaterialCommunityIcons,
  ICONS,
  getCategoryIcon,
  colors,
  radii,
  spacing,
  fontSize,
  fontWeight,
  lineHeight,
  shadow,
  layout,
  HIT_SIZE,
} from '@/theme';
import { StatusPill } from './StatusPill';

interface ReportCardProps {
  report: Report;
  onPress: () => void;
  onSupport?: () => void;
  showDistance?: boolean;
  userLocation?: { latitude: number; longitude: number } | null;
  style?: object;
}

/** Distância em linha reta entre dois pontos, em metros. */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Card de ocorrência.
 *
 * Semântica emproximação (Gestalt): categoria e status ficam juntos no topo,
 * o texto principal no meio e os metadados separados por um divisor na base.
 *
 * O botão de apoio fica FORA do Pressable do card. Dentro dele, o toque no
 * botão também abriria o card — dois alvos sobrepostos brigando pelo mesmo
 * gesto.
 */
export const ReportCard = React.memo(
  ({ report, onPress, onSupport, showDistance = true, userLocation, style }: ReportCardProps) => {
    const supports = report.supports_count ?? 0;
    const coords = report.location?.coordinates;

    const distance =
      showDistance && userLocation && Array.isArray(coords) && coords.length >= 2
        ? formatDistance(haversine(userLocation.latitude, userLocation.longitude, coords[1], coords[0]))
        : null;

    const categoryLabel = report.category?.label ?? 'Categoria';
    // O título vem do banco; quando repete a categoria, a descrição vira o
    // texto principal para não mostrar a mesma palavra duas vezes.
    const titleIsCategory = !report.title || report.title === categoryLabel;
    const headline = titleIsCategory ? null : report.title;

    const accessibilityLabel = [
      categoryLabel,
      headline,
      `${supports} ${supports === 1 ? 'apoio' : 'apoios'}`,
      distance ? `a ${distance}` : null,
      `atualizado ${formatRelativeTime(report.updated_at)}`,
    ]
      .filter(Boolean)
      .join(', ');

    return (
      <View style={[styles.card, style]}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint="Abre os detalhes do registro"
          style={({ pressed }: { pressed: boolean }) => [
            styles.main,
            pressed && styles.mainPressed,
          ]}
        >
          <View style={styles.header}>
            <View style={styles.category}>
              <MaterialCommunityIcons
                name={getCategoryIcon(report.category?.slug)}
                size={18}
                color={colors.primary}
              />
              <Text style={styles.categoryLabel} numberOfLines={1}>
                {categoryLabel}
              </Text>
            </View>

            <StatusPill status={report.status} />
          </View>

          {headline ? (
            <Text style={styles.title} numberOfLines={2}>
              {headline}
            </Text>
          ) : null}

          {report.description ? (
            <Text style={[styles.description, !headline && styles.descriptionLead]} numberOfLines={3}>
              {report.description}
            </Text>
          ) : null}

          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name={ICONS.thumbUp} size={15} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {supports} {supports === 1 ? 'apoio' : 'apoios'}
              </Text>
            </View>

            {distance ? (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="map-marker-outline" size={15} color={colors.textMuted} />
                <Text style={styles.metaText}>{distance}</Text>
              </View>
            ) : null}

            <View style={styles.metaItem}>
              <MaterialCommunityIcons name={ICONS.clock} size={15} color={colors.textMuted} />
              <Text style={styles.metaText}>{formatRelativeTime(report.updated_at)}</Text>
            </View>
          </View>
        </Pressable>

        {onSupport ? (
          <Pressable
            onPress={onSupport}
            accessibilityRole="button"
            accessibilityLabel={`Apoiar ${headline || categoryLabel}`}
            style={({ pressed }: { pressed: boolean }) => [
              styles.supportButton,
              pressed && styles.supportButtonPressed,
            ]}
          >
            <MaterialCommunityIcons name={ICONS.thumbUp} size={18} color={colors.primary} />
            <Text style={styles.supportLabel}>Apoiar</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
);

ReportCard.displayName = 'ReportCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.sm,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  main: {
    padding: spacing.base,
    gap: spacing.xs,
  },
  mainPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  category: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm - 4,
    flexShrink: 1,
  },
  categoryLabel: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
    lineHeight: fontSize.title * lineHeight.tight,
  },
  description: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    lineHeight: fontSize.small * lineHeight.snug,
  },
  descriptionLead: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.base,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  metaText: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: HIT_SIZE,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.primarySoft,
  },
  supportButtonPressed: {
    backgroundColor: colors.primaryBorder,
  },
  supportLabel: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});