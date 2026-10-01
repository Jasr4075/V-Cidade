import * as Location from 'expo-location';
import { DEFAULT_MAP_REGION } from '@/constants';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation(): Promise<Coordinates | null> {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) return null;

  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      maximumAge: 10000,
      timeout: 15000,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch {
    return null;
  }
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (results.length > 0) {
      const result = results[0];
      const parts = [
        result.street,
        result.district,
        result.city,
        result.region,
      ].filter(Boolean);
      return parts.join(', ');
    }
  } catch {
    // Ignore errors
  }
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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

export function getDefaultRegion() {
  return DEFAULT_MAP_REGION;
}

export function coordinatesToPoint(latitude: number, longitude: number): string {
  return `POINT(${longitude} ${latitude})`;
}

export function pointToCoordinates(point: string): Coordinates | null {
  const match = point.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
  if (match) {
    return {
      longitude: parseFloat(match[1]),
      latitude: parseFloat(match[2]),
    };
  }
  return null;
}