import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { ReportUpdate, Photo } from '@/types';
import { formatDate } from '@/utils';
import { UPDATE_STATUS_LABELS } from '@/constants';
import { getUpdateStatusPalette, statusTone, MaterialCommunityIcons, ICONS, UPDATE_STATUS_ICONS, colors, radii, spacing, fontSize, fontWeight, lineHeight } from '@/theme';
interface TimelineProps {
  updates: (ReportUpdate & { photos?: Photo[] })[];
  initialReport?: {
    title: string;
    photos?: Photo[];
    created_at: string;
  };
}

interface TimelineItem {
  id: string;
  date: string;
  status: string;
  label: string;
  description: string;
  photos?: Photo[];
  isInitial: boolean;
}

/**
 * Linha do tempo do problema.
 *
 * O marcador carrega ícone + rótulo + cor: cor sozinha não distingue
 * "continua igual" de "melhorou".
 */
export const Timeline = ({ updates, initialReport }: TimelineProps) => {
  const items = useMemo<TimelineItem[]>(() => {
    const list: TimelineItem[] = [];

    if (initialReport) {
      list.push({
        id: 'initial',
        date: initialReport.created_at,
        status: 'REGISTERED',
        label: 'Registrado',
        description: 'Problema registrado por um morador',
        photos: initialReport.photos,
        isInitial: true,
      });
    }

    for (const update of updates) {
      list.push({
        id: update.id,
        date: update.created_at,
        status: update.status,
        label: UPDATE_STATUS_ICONS[update.status],
        description: update.description,
        photos: update.photos,
        isInitial: false,
      });
    }

    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [updates, initialReport]);

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <MaterialCommunityIcons name={ICONS.history} size={24} color={colors.textMuted} />
        <Text style={styles.emptyText}>Nenhuma atualização ainda</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const tone = item.isInitial
          ? statusTone.neutral
          : getUpdateStatusPalette(item.status);
        const iconName = item.isInitial ? ICONS.image : UPDATE_STATUS_ICONS[item.status as keyof typeof UPDATE_STATUS_ICONS];
        const label = item.isInitial ? item.label : UPDATE_STATUS_LABELS[item.status] ?? item.status;

        return (
          <View key={item.id} style={styles.item}>
            <View style={styles.rail}>
              <View style={[styles.marker, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                <MaterialCommunityIcons
                  name={iconName}
                  size={14}
                  color={item.isInitial ? colors.textSecondary : tone.fg}
                />
              </View>
              {!isLast ? <View style={styles.line} /> : null}
            </View>

            <View style={styles.content}>
              <View style={styles.header}>
                <Text
                  style={[
                    styles.label,
                    item.isInitial ? styles.labelInitial : { color: tone.fg },
                  ]}
                >
                  {label}
                </Text>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
              </View>

              {item.description ? (
                <Text style={styles.description}>{item.description}</Text>
              ) : null}

              {item.photos && item.photos.length > 0 ? (
                <View style={styles.photos}>
                  {item.photos.slice(0, 3).map((photo) => (
                    <Image
                      key={photo.id}
                      source={{ uri: photo.storage_path }}
                      style={styles.photo}
                      resizeMode="cover"
                      accessibilityLabel={`Foto de ${formatDate(item.date)}`}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
};

Timeline.displayName = 'Timeline';

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },

  item: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rail: {
    width: 32,
    alignItems: 'center',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    width: 2,
    marginVertical: spacing.xxs,
    backgroundColor: colors.divider,
  },

  content: {
    flex: 1,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.bold,
  },
  labelInitial: {
    color: colors.textSecondary,
  },
  date: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  description: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
    lineHeight: fontSize.small * lineHeight.snug,
  },
  photos: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSunken,
  },
});