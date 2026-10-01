import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ReportStatus } from '@/types';
import { getStatusColor } from '@/utils';

interface MapMarkerProps {
  status: ReportStatus;
  count?: number;
  onPress?: () => void;
}

export const MapMarker = React.memo(({ status, count, onPress }: MapMarkerProps) => {
  const color = getStatusColor(status);
  const size = count && count > 1 ? 40 : 32;

  return (
    <View
      style={[styles.markerContainer, { width: size, height: size }]}
      onPress={onPress}
    >
      <View
        style={[
          styles.marker,
          { backgroundColor: color, width: size - 8, height: size - 8 },
        ]}
      />
      {count && count > 1 && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}
    </View>
  );
});

MapMarker.displayName = 'MapMarker';

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  countBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    backgroundColor: '#1976D2',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});