import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ReportStatus as ReportStatusType } from '@/types';
import { STATUS_LABELS } from '@/constants';
import {
  radii,
  spacing,
  fontSize,
  fontWeight,
  getStatusPalette,
} from '@/theme';
import { MaterialCommunityIcons, STATUS_ICONS } from '@/theme/icons';

interface ReportStatusBadgeProps {
  status: ReportStatusType;
  size?: 'small' | 'medium' | 'large';
  /** Oculta o rótulo — usado só em contexto muito apertado (ex.: marcador de mapa). */
  showLabel?: boolean;
  confirmationsCount?: number;
}

const sizes = {
  small: { padH: spacing.sm, padV: 3, font: fontSize.caption, icon: 13, radius: radii.sm },
  medium: { padH: spacing.md, padV: 5, font: fontSize.caption + 1, icon: 15, radius: radii.md },
  large: { padH: spacing.base, padV: spacing.sm, font: fontSize.small, icon: 18, radius: radii.md },
};

/**
 * Status de ocorrência.
 * Acessibilidade: o status é comunicado por ícone + rótulo textual.
 * A cor é reforço, nunca o único sinal.
 */
export const ReportStatusBadge = ({
  status,
  size = 'medium',
  showLabel = true,
  confirmationsCount,
}: ReportStatusBadgeProps) => {
  const tone = getStatusPalette(status);
  const label = STATUS_LABELS[status] || status;
  const s = sizes[size];
  const icon = STATUS_ICONS[status] ?? 'help-circle-outline';
  const showConfirmations = confirmationsCount != null && confirmationsCount > 0;

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={
        showConfirmations
          ? `${label}, ${confirmationsCount} confirmações de resolução`
          : label
      }
      style={[
        styles.container,
        {
          backgroundColor: tone.bg,
          borderColor: tone.border,
          borderRadius: s.radius,
          paddingHorizontal: s.padH,
          paddingVertical: s.padV,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={s.icon} color={tone.fg} />
      {showLabel ? (
        <Text style={[styles.label, { color: tone.fg, fontSize: s.font }]} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
      {showLabel && showConfirmations ? (
        <Text style={[styles.confirmations, { color: tone.fg, fontSize: s.font - 1 }]} numberOfLines={1}>
          {`${confirmationsCount} de 3`}
        </Text>
      ) : null}
    </View>
  );
};

ReportStatusBadge.displayName = 'ReportStatusBadge';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: fontWeight.semibold,
    flexShrink: 1,
  },
  confirmations: {
    fontWeight: fontWeight.regular,
    opacity: 0.85,
  },
});