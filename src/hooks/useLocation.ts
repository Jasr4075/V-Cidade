import { useState, useEffect, useCallback, useRef } from 'react';
import { Coordinates, requestLocationPermission, getCurrentLocation, reverseGeocode, getDefaultRegion } from '@/services/location/location';

export function useLocation() {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await requestLocationPermission();
    if (mounted.current) setPermissionGranted(granted);
    return granted;
  }, []);

  const getLocation = useCallback(async () => {
    if (mounted.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const coords = await getCurrentLocation();
      if (!mounted.current) return null;
      if (coords) {
        setCoordinates(coords);
      } else {
        setError('Não foi possível obter sua localização');
      }
      return coords;
    } catch {
      if (mounted.current) setError('Erro ao obter localização');
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const granted = await requestPermission();
      if (!mounted.current) return;
      if (!granted) {
        setError('Permissão de localização negada');
        setLoading(false);
        return;
      }
      await getLocation();
    })();
  }, [requestPermission, getLocation]);

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