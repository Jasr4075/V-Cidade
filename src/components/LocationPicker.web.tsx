import React, { useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Coordinates, getCurrentLocation, reverseGeocode } from '@/services/location/location';

/**
 * Respaldo de selector de ubicación para la plataforma web.
 *
 * `react-native-maps` es una librería nativa (Android/iOS) incompatible con
 * react-native-web (usa `codegenNativeComponent`, removido de RN-W 0.21.x).
 * Expo resuelve automáticamente `LocationPicker.native.tsx` en dispositivos y
 * este archivo (`.web.tsx`) en navegadores, sin llegar a importar `react-native-maps`.
 */

interface LocationPickerProps {
  initialLocation?: Coordinates;
  onLocationSelect: (location: Coordinates, address: string) => void;
  onCancel: () => void;
  title?: string;
}

function parseCoordinate(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export const LocationPicker = ({
  initialLocation,
  onLocationSelect,
  onCancel,
  title = 'Escolher localização',
}: LocationPickerProps) => {
  const [latStr, setLatStr] = React.useState(initialLocation ? String(initialLocation.latitude) : '');
  const [lngStr, setLngStr] = React.useState(initialLocation ? String(initialLocation.longitude) : '');
  const [address, setAddress] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const selectedLat = parseCoordinate(latStr);
  const selectedLng = parseCoordinate(lngStr);
  const hasSelection = selectedLat !== null && selectedLng !== null;

  useEffect(() => {
    if (initialLocation) {
      reverseGeocode(initialLocation.latitude, initialLocation.longitude).then(setAddress);
    }
  }, [initialLocation]);

  const handleAddressLookup = () => {
    if (!hasSelection) return;
    setLoading(true);
    reverseGeocode(selectedLat!, selectedLng!).then((addr) => {
      setAddress(addr);
      setLoading(false);
    });
  };

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        setLatStr(String(location.latitude).substring(0, 9));
        setLngStr(String(location.longitude).substring(0, 9));
        const addr = await reverseGeocode(location.latitude, location.longitude);
        setAddress(addr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!hasSelection) return;
    onLocationSelect({ latitude: selectedLat!, longitude: selectedLng! }, address);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton} disabled={!hasSelection}>
          <Text style={[styles.confirmButtonText, !hasSelection && styles.confirmButtonTextDisabled]}>
            Confirmar
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.addressContainer}>
        <Text style={styles.addressLabel}>Endereço:</Text>
        {loading ? (
          <Text style={styles.addressLoading}>Buscando endereço...</Text>
        ) : (
          <Text style={styles.addressText}>{address || 'Ingresa coordenadas para ver la dirección'}</Text>
        )}
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Ingresa las coordenadas del problema</Text>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Latitud</Text>
            <TextInput
              style={styles.input}
              value={latStr}
              onChangeText={setLatStr}
              placeholder="-23.5505"
              inputMode="decimal"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Longitud</Text>
            <TextInput
              style={styles.input}
              value={lngStr}
              onChangeText={setLngStr}
              placeholder="-46.6333"
              inputMode="decimal"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {hasSelection && (
          <TouchableOpacity
            style={styles.addressButton}
            onPress={handleAddressLookup}
            activeOpacity={0.8}
          >
            <Text style={styles.addressButtonText}>Buscar dirección</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderIcon}>🗺️</Text>
        <Text style={styles.mapPlaceholderText}>
          El mapa interactivo está disponible en la app para Android/iOS.{'\n'}
          Aquí puedes ingresar las coordenadas manualmente.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.currentLocationButton}
        onPress={handleUseCurrentLocation}
        disabled={loading}
      >
        <Text style={styles.currentLocationButtonText}>
          {loading ? 'Obtendo localização...' : 'Usar mi localización actual'}
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
  form: {
    padding: 16,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#C0C0C0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#fff',
  },
  addressButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
  },
  addressButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1976D2',
  },
  mapPlaceholder: {
    flex: 1,
    marginTop: 8,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
  },
  mapPlaceholderIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  mapPlaceholderText: {
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
    textAlign: 'center',
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