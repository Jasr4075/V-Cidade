import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ViewStyle } from 'react-native';
import { Report } from '@/types';
import { formatDistance, formatRelativeTime, getStatusColor } from '@/utils';
import { STATUS_LABELS } from '@/constants';

interface ReportCardProps {
  report: Report;
  onPress: () => void;
  onSupport?: () => void;
  showDistance?: boolean;
  userLocation?: { latitude: number; longitude: number } | null;
  style?: ViewStyle;
}

export const ReportCard = React.memo(
  ({ report, onPress, onSupport, showDistance = true, userLocation, style }: ReportCardProps) => {
    const statusColor = getStatusColor(report.status);
    const distance = showDistance && userLocation
      ? formatDistance(
          calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            report.location.coordinates[1],
            report.location.coordinates[0]
          )
        )
      : null;

    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.header}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryIcon}>{report.category?.icon || '📍'}</Text>
            <Text style={styles.categoryName}>{report.category?.label || report.category_id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{STATUS_LABELS[report.status] || report.status}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={1}>{report.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{report.description}</Text>

        <View style={styles.footer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>
              {report.supports_count || 0} apoio{report.supports_count !== 1 ? 's' : ''}
            </Text>
            {distance && (
              <Text style={styles.infoText}>📍 {distance}</Text>
            )}
          </View>
          <Text style={styles.timeText}>{formatRelativeTime(report.updated_at)}</Text>
        </View>

        {onSupport && (
          <TouchableOpacity style={styles.supportButton} onPress={onSupport} activeOpacity={0.8}>
            <Text style={styles.supportButtonText}>Apoiar</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }
);

ReportCard.displayName = 'ReportCard';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  supportButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    alignItems: 'center',
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
});