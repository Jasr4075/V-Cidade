import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ANONYMOUS_ID_KEY } from '@/constants';
import { setSupabaseAnonymousId } from '@/services/supabase';

// expo-secure-store has no web implementation (it resolves to an empty object),
// so on web the id is kept in AsyncStorage instead. Without this the browser
// generated a new identity on every reload, losing supports and confirmations.
const isWeb = Platform.OS === 'web';

const anonymousIdStorage = {
  get: (key: string) => (isWeb ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key)),
  set: (key: string, value: string) =>
    isWeb ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value),
};

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * `anonymous_id` is a UUID column in Postgres and is compared by the RLS
 * policies, so it must always be a valid v4 UUID.
 *
 * Uses `expo-crypto` instead of the `uuid` package: the latter needs the Web
 * Crypto API, which Hermes does not provide, so `uuidv4()` threw
 * "Property 'crypto' doesn't exist" on Android.
 */
export async function getAnonymousId(): Promise<string> {
  let stored: string | null = null;

  try {
    stored = await anonymousIdStorage.get(ANONYMOUS_ID_KEY);
  } catch {
    stored = null;
  }

  if (!stored || !UUID_V4.test(stored)) {
    stored = Crypto.randomUUID();

    try {
      await anonymousIdStorage.set(ANONYMOUS_ID_KEY, stored);
    } catch {
      // keep the in-memory id even when persistence is unavailable
    }
  }

  setSupabaseAnonymousId(stored);
  return stored;
}

/**
 * Distância legível. `m` abaixo de 1 km, `km` acima — sem decimais desnecessários.
 */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return 'distância desconhecida';
  if (meters < 1000) return `${Math.round(meters)} m`;

  const km = meters / 1000;
  // Uma casa decimal só quando ela acrescenta informação (< 10 km).
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'agora mesmo';
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours} h`;
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semana${diffDays >= 14 ? 's' : ''}`;

  const months = Math.floor(diffDays / 30);
  if (months < 12) return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;

  const years = Math.floor(diffDays / 365);
  return `há ${years} ${years === 1 ? 'ano' : 'anos'}`;
}

export function validateDescription(description: string, maxLength: number): string | null {
  if (!description || description.trim().length === 0) {
    return 'Descrição é obrigatória';
  }
  if (description.length > maxLength) {
    return `Descrição deve ter no máximo ${maxLength} caracteres`;
  }
  return null;
}

export function validateCoordinates(latitude: number, longitude: number): string | null {
  if (latitude < -90 || latitude > 90) {
    return 'Latitude inválida';
  }
  if (longitude < -180 || longitude > 180) {
    return 'Longitude inválida';
  }
  return null;
}

/**
 * Converte metros em texto legível.
 * Usa Intl quando disponível (distância curta em pés para públicos en/US)
 * e cai para "m" / "km" quando a API não existe no runtime.
 */
/**
 * Extrai `{ latitude, longitude }` de uma resposta `location`, aceitando os
 * formatos em que o PostGIS pode devolver (GeoJSON Point, array [lon, lat] ou null).
 */
export function getCoordinates(
  location: { type?: string; coordinates?: number[] } | null | undefined
): { latitude: number; longitude: number } | null {
  const raw = location?.coordinates;
  if (!Array.isArray(raw) || raw.length < 2) return null;

  const longitude = Number(raw[0]);
  const latitude = Number(raw[1]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return { latitude, longitude };
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}