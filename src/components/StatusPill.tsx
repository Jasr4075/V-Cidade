import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ReportStatus } from '@/types';
import { STATUS_LABELS } from '@/constants';
import { getStatusPalette, MaterialCommunityIcons, STATUS_ICONS, radii, spacing, fontSize, fontWeight } from '@/theme';
interface StatusPillProps {
  status: ReportStatus;
  size?: 'small' | 'medium';
}

/**
 * Selo compacto de status para listas e cartões.
 * Ícone + texto: o estado nunca depende só da cor.
 */
export const StatusPill = ({ status, size = 'small' }: StatusPillProps) => {
  const tone = getStatusPalette(status);
  const compact = size === 'small';

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={STATUS_LABELS[status] ?? status}
      style={[
        styles.pill,
        {
          backgroundColor: tone.bg,
          borderColor: tone.border,
          paddingVertical: compact ? 3 : spacing.xs + 1,
          paddingHorizontal: compact ? spacing.sm : spacing.md,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={STATUS_ICONS[status] ?? 'help-circle-outline'}
        size={compact ? 13 : 15}
        color={tone.fg}
      />
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          { color: tone.fg, fontSize: compact ? fontSize.caption : fontSize.small },
        ]}
      >
        {STATUS_LABELS[status] ?? status}
      </Text>
    </View>
  );
};

StatusPill.displayName = 'StatusPill';

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 1,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
    flexShrink: 1,
  },
  label: {
    fontWeight: fontWeight.semibold,
    flexShrink: 1,
  },
});