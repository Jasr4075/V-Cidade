import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { ReportUpdate, Photo } from '@/types';
import { formatDate, getUpdateStatusColor } from '@/utils';
import { UPDATE_STATUS_LABELS } from '@/constants';

interface TimelineProps {
  updates: Array<ReportUpdate & { photos?: Photo[] }>;
  initialReport?: {
    title: string;
    photos?: Photo[];
    created_at: string;
  };
}

export const Timeline = ({ updates, initialReport }: TimelineProps) => {
  const allItems = React.useMemo(() => {
    const items: Array<{
      id: string;
      date: string;
      status: string;
      description: string;
      photos?: Photo[];
      isInitial: boolean;
    }> = [];

    if (initialReport) {
      items.push({
        id: 'initial',
        date: initialReport.created_at,
        status: 'REGISTERED',
        description: 'Problema registrado',
        photos: initialReport.photos,
        isInitial: true,
      });
    }

    updates.forEach((update) => {
      items.push({
        id: update.id,
        date: update.created_at,
        status: update.status,
        description: update.description || UPDATE_STATUS_LABELS[update.status] || update.status,
        photos: update.photos,
        isInitial: false,
      });
    });

    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [updates, initialReport]);

  if (allItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhuma atualização ainda</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {allItems.map((item, index) => (
        <View key={item.id} style={styles.item}>
          <View style={styles.lineContainer}>
            <View
              style={[
                styles.dot,
                { backgroundColor: getUpdateStatusColor(item.status) },
              ]}
            />
            {index < allItems.length - 1 && <View style={styles.line} />}
          </View>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={[
                styles.statusLabel,
                { color: getUpdateStatusColor(item.status) },
              ]}>
                {item.isInitial ? '📷 Registrado' : UPDATE_STATUS_LABELS[item.status] || item.status}
              </Text>
              <Text style={styles.date}>{formatDate(item.date)}</Text>
            </View>
            <Text style={styles.description}>{item.description}</Text>
            {item.photos && item.photos.length > 0 && (
              <View style={styles.photos}>
                {item.photos.slice(0, 3).map((photo, photoIndex) => (
                  <Image
                    key={photoIndex}
                    source={{ uri: photo.storage_path }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

Timeline.displayName = 'Timeline';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  item: {
    flexDirection: 'row',
    paddingVertical: 16,
  },
  lineContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
    zIndex: 1,
  },
  line: {
    position: 'absolute',
    top: 16,
    bottom: -16,
    width: 2,
    backgroundColor: '#E0E0E0',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  description: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  photos: {
    flexDirection: 'row',
    gap: 8,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
});