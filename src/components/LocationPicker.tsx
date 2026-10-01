import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Coordinates, getCurrentLocation, reverseGeocode } from '@/services/location/location';

interface LocationPickerProps {
  initialLocation?: Coordinates;
  onLocationSelect: (location: Coordinates, address: string) => void;
  onCancel: () => void;
  title?: string;
}

export const LocationPicker = ({
  initialLocation,
  onLocationSelect,
  onCancel,
  title = 'Escolher localização',
}: LocationPickerProps) => {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = React.useState({
    latitude: initialLocation?.latitude || -23.5505,
    longitude: initialLocation?.longitude || -46.6333,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedLocation, setSelectedLocation] = React.useState<Coordinates | null>(initialLocation || null);
  const [address, setAddress] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (initialLocation) {
      reverseGeocode(initialLocation.latitude, initialLocation.longitude).then(setAddress);
    }
  }, [initialLocation]);

  const handleRegionChange = (newRegion: typeof region) => {
    setRegion(newRegion);
  };

  const handleMapPress = (event: { nativeEvent: { coordinate: Coordinates } }) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newLocation = { latitude, longitude };
    setSelectedLocation(newLocation);
    setLoading(true);
    reverseGeocode(latitude, longitude).then((addr) => {
      setAddress(addr);
      setLoading(false);
    });
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation, address);
    }
  };

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        setSelectedLocation(location);
        setRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        const addr = await reverseGeocode(location.latitude, location.longitude);
        setAddress(addr);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton} disabled={!selectedLocation}>
          <Text style={[
            styles.confirmButtonText,
            !selectedLocation && styles.confirmButtonTextDisabled,
          ]}>
            Confirmar
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.addressContainer}>
        <Text style={styles.addressLabel}>Endereço:</Text>
        {loading ? (
          <Text style={styles.addressLoading}>Buscando endereço...</Text>
        ) : (
          <Text style={styles.addressText}>{address || 'Toque no mapa para selecionar'}</Text>
        )}
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          onRegionChange={handleRegionChange}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              title="Local selecionado"
            >
              <View style={styles.marker} />
            </Marker>
          )}
        </MapView>
      </View>

      <TouchableOpacity style={styles.currentLocationButton} onPress={handleUseCurrentLocation} disabled={loading}>
        <Text style={styles.currentLocationButtonText}>
          {loading ? 'Obtendo localização...' : 'Usar minha localização atual'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

LocationPicker.displayName = 'LocationPicker';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  confirmButton: {
    padding: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: '600',
  },
  confirmButtonTextDisabled: {
    color: '#999',
  },
  addressContainer: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  addressLoading: {
    fontSize: 16,
    color: '#999',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E53935',
    borderWidth: 3,
    borderColor: '#fff',
  },
  currentLocationButton: {
    padding: 16,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  currentLocationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
});