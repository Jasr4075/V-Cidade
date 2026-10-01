import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Report } from '@/types';
import { getStatusColor, formatRelativeTime } from '@/utils';

/**
 * Respaldo de mapa para la plataforma web.
 *
 * `react-native-maps` es una librería nativa (Android/iOS) que no es compatible
 * con react-native-web (usa `codegenNativeComponent`, removido de RN-W 0.21.x).
 * Expo resuelve automáticamente `MapView.native.tsx` en dispositivos y este
 * archivo (`.web.tsx`) en navegadores, sin llegar a importar `react-native-maps`.
 */

// Tipo local equivalente a la `Region` de react-native-maps para mantener la firma.
export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapViewProps {
  reports: Report[];
  region: Region;
  onRegionChange: (region: Region) => void;
  onPressMarker: (report: Report) => void;
  selectedReportId?: string;
  categoryFilter?: string;
  showUserLocation?: boolean;
  userLocation?: { latitude: number; longitude: number } | null;
  style?: object;
}

export const MapViewComponent = React.memo(({
  reports,
  onPressMarker,
  selectedReportId,
  categoryFilter,
  style,
}: MapViewProps) => {
  const filteredReports = categoryFilter
    ? reports.filter(r => r.category_id === categoryFilter)
    : reports;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.notice}>
        <Text style={styles.noticeIcon}>🗺️</Text>
        <Text style={styles.noticeText}>
          El mapa interactivo está disponible en la app para Android/iOS.
        </Text>
      </View>

      {filteredReports.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No se encontraron problemas {categoryFilter ? 'para este filtro' : 'cerca'}.
          </Text>
        </View>
      ) : (
        filteredReports.map((report) => {
          const isSelected = report.id === selectedReportId;
          return (
            <TouchableOpacity
              key={report.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => onPressMarker(report)}
              activeOpacity={0.7}
            >
              <View style={[styles.dot, { backgroundColor: getStatusColor(report.status) }]} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>
                  {report.category?.icon || '📍'} {report.title}
                </Text>
                <Text style={styles.cardMeta} numberOfLines={2}>
                  {report.description}
                </Text>
                <Text style={styles.cardMeta}>
                  {formatRelativeTime(report.created_at)}
                </Text>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
});

MapViewComponent.displayName = 'MapViewComponent';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  noticeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
  empty: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardSelected: {
    borderColor: '#1976D2',
    backgroundColor: '#F5F9FF',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
    marginTop: 14,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cardMeta: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  cardArrow: {
    fontSize: 20,
    color: '#999',
    alignSelf: 'center',
  },
});