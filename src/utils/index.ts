import { v4 as uuidv4 } from 'uuid';
import { ANONYMOUS_ID_KEY } from '@/constants';
import * as SecureStore from 'expo-secure-store';

export async function getAnonymousId(): Promise<string> {
  try {
    let anonymousId = await SecureStore.getItemAsync(ANONYMOUS_ID_KEY);
    if (!anonymousId) {
      anonymousId = uuidv4();
      await SecureStore.setItemAsync(ANONYMOUS_ID_KEY, anonymousId);
    }
    return anonymousId;
  } catch {
    let anonymousId = uuidv4();
    try {
      await SecureStore.setItemAsync(ANONYMOUS_ID_KEY, anonymousId);
    } catch {
    }
    return anonymousId;
  }
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
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
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
  return formatDate(dateString);
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

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: '#E53935',
    IMPROVING: '#FDD835',
    RESOLVED: '#43A047',
    ARCHIVED: '#9E9E9E',
  };
  return colors[status] || '#9E9E9E';
}

export function getUpdateStatusColor(status: string): string {
  const colors: Record<string, string> = {
    SAME: '#E53935',
    WORSE: '#FF9800',
    BETTER: '#FDD835',
    RESOLVED: '#43A047',
  };
  return colors[status] || '#9E9E9E';
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