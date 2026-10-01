import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Coordinates, requestLocationPermission, getCurrentLocation, reverseGeocode, getDefaultRegion } from '@/services/location/location';

export function useLocation() {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requestPermission = useCallback(async () => {
    const granted = await requestLocationPermission();
    setPermissionGranted(granted);
    return granted;
  }, []);

  const getLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const coords = await getCurrentLocation();
      if (coords) {
        setCoordinates(coords);
      } else {
        setError('Não foi possível obter sua localização');
      }
    } catch {
      setError('Erro ao obter localização');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  return {
    coordinates,
    loading,
    error,
    permissionGranted,
    getLocation,
    requestPermission,
  };
}

export function useReverseGeocode(latitude: number, longitude: number) {
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    reverseGeocode(latitude, longitude).then((result) => {
      if (mounted) {
        setAddress(result);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [latitude, longitude]);

  return { address, loading };
}

export function useMapRegion(initialRegion?: Coordinates) {
  const [region, setRegion] = useState(() => {
    if (initialRegion) {
      return {
        latitude: initialRegion.latitude,
        longitude: initialRegion.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    return getDefaultRegion();
  });

  const navigateTo = useCallback((coords: Coordinates) => {
    setRegion({
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  }, []);

  return { region, setRegion, navigateTo };
}