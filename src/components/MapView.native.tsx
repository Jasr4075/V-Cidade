import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { Report } from '@/types';
import { MapMarker } from './MapMarker';
import { getStatusColor } from '@/utils';

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

export const MapViewComponent = React.memo(
  ({
    reports,
    region,
    onRegionChange,
    onPressMarker,
    selectedReportId,
    categoryFilter,
    showUserLocation = true,
    userLocation,
    style,
  }: MapViewProps) => {
    const filteredReports = categoryFilter
      ? reports.filter(r => r.category_id === categoryFilter)
      : reports;

    const groupedReports = groupReportsByLocation(filteredReports);

    return (
      <View style={[styles.container, style]}>
        <MapView
          style={styles.map}
          initialRegion={region}
          onRegionChangeComplete={onRegionChange}
          showsUserLocation={showUserLocation}
          showsMyLocationButton={true}
          showsCompass={false}
          rotateEnabled={false}
          pitchEnabled={false}
          maxZoomLevel={18}
          minZoomLevel={10}
        >
          {userLocation && showUserLocation && (
            <Marker
              coordinate={userLocation}
              key="user-location"
              title="Sua localização"
            >
              <View style={styles.userLocationMarker} />
            </Marker>
          )}

          {groupedReports.map((group) => (
            <Marker
              key={`${group.latitude}-${group.longitude}`}
              coordinate={{ latitude: group.latitude, longitude: group.longitude }}
              onPress={() => onPressMarker(group.reports[0])}
            >
              <MapMarker
                status={group.reports[0].status}
                count={group.reports.length}
              />
            </Marker>
          ))}

          {selectedReportId && (
            <Marker
              coordinate={
                filteredReports.find(r => r.id === selectedReportId)?.location.coordinates
                  ? {
                      latitude: filteredReports.find(r => r.id === selectedReportId)!.location.coordinates[1],
                      longitude: filteredReports.find(r => r.id === selectedReportId)!.location.coordinates[0],
                    }
                  : region
              }
            >
              <View style={styles.selectedMarker} />
            </Marker>
          )}
        </MapView>

        {categoryFilter && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>
              Filtrando por: {reports.find(r => r.category_id === categoryFilter)?.category?.label || categoryFilter}
            </Text>
          </View>
        )}
      </View>
    );
  }
);

MapViewComponent.displayName = 'MapViewComponent';

function groupReportsByLocation(reports: Report[], threshold = 0.0005): Array<{ latitude: number; longitude: number; reports: Report[] }> {
  const groups: Array<{ latitude: number; longitude: number; reports: Report[] }> = [];

  for (const report of reports) {
    const [longitude, latitude] = report.location.coordinates;
    let found = false;

    for (const group of groups) {
      if (
        Math.abs(group.latitude - latitude) < threshold &&
        Math.abs(group.longitude - longitude) < threshold
      ) {
        group.reports.push(report);
        found = true;
        break;
      }
    }

    if (!found) {
      groups.push({ latitude, longitude, reports: [report] });
    }
  }

  return groups;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  userLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1976D2',
    borderWidth: 3,
    borderColor: '#fff',
  },
  selectedMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF9800',
    borderWidth: 3,
    borderColor: '#fff',
  },
  filterBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 10,
  },
  filterBadgeText: {
    fontSize: 14,
    color: '#1A1A1A',
    flex: 1,
  },
});