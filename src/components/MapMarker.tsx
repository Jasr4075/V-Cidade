import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ReportStatus } from '@/types';
import { getStatusPalette, colors, radii, shadow, fontWeight, palette } from '@/theme';
interface MapMarkerProps {
  status: ReportStatus;
  count?: number;
  selected?: boolean;
  onPress?: () => void;
}

/**
 * Marcador do mapa.
 *
 * O anel colorido mostra o status, mas o ícone dentro é que garante a leitura
 * sem depender de cor. Quando há mais de um problema no mesmo ponto, o número
 * aparece dentro do marcador em vez de num balão sobreposto.
 */
export const MapMarker = React.memo(
  ({ status, count, selected = false, onPress }: MapMarkerProps) => {
    const tone = getStatusPalette(status);
    const size = selected ? 40 : (count ?? 0) > 1 ? 36 : 30;
    const dot = size - 12;

    const content = (
      <View
        style={[
          styles.outer,
          {
            width: size,
            height: size,
            borderRadius: radii.pill,
            backgroundColor: tone.bg,
            borderColor: selected ? colors.primary : tone.border,
            borderWidth: selected ? 3 : 2,
          },
        ]}
      >
        {count && count > 1 ? (
          <Text style={[styles.count, { fontSize: size * 0.36 }]}>{count}</Text>
        ) : (
          <View style={[styles.dot, { width: dot, height: dot, borderRadius: dot / 2, backgroundColor: tone.fg }]} />
        )}
      </View>
    );

    if (!onPress) return content;

    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={
          count && count > 1
            ? `${count} problemas aqui`
            : `Problema ${String(status).toLowerCase()}`
        }
        hitSlop={6}
        style={({ pressed }: { pressed: boolean }) => [
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }
);

MapMarker.displayName = 'MapMarker';

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.gray900,
    ...(shadow.md as object),
  },
  dot: {},
  count: {
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
});