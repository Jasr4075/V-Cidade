import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { ReportUpdate, Photo } from '@/types';
import { formatDate, getUpdateStatusColor } from '@/utils';
import { UPDATE_STATUS_LABELS } from '@/constants';

interface UpdateCardProps {
  update: ReportUpdate & { photos?: Photo[] };
  index: number;
  total: number;
}

export const UpdateCard = ({ update, index, total }: UpdateCardProps) => {
  const statusColor = getUpdateStatusColor(update.status);
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <View style={styles.container}>
      <View style={styles.lineContainer}>
        <View
          style={[
            styles.dot,
            { backgroundColor: statusColor },
          ]}
        />
        {!isLast && <View style={styles.line} />}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.statusLabel, { color: statusColor }]}>
            {UPDATE_STATUS_LABELS[update.status] || update.status}
          </Text>
          <Text style={styles.date}>{formatDate(update.created_at)}</Text>
        </View>
        {update.description && <Text style={styles.description}>{update.description}</Text>}
        {update.photos && update.photos.length > 0 && (
          <View style={styles.photos}>
            {update.photos.slice(0, 3).map((photo, photoIndex) => (
              <View key={photoIndex} style={styles.photoWrapper}>
                {/* Photo would be rendered here with Image component */}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

UpdateCard.displayName = 'UpdateCard';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  lineContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#fff',
    zIndex: 1,
  },
  line: {
    position: 'absolute',
    top: 14,
    bottom: -12,
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
  photoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
});