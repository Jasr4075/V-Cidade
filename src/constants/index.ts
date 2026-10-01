import { Category } from '@/types';

export const CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Buraco',
    slug: 'buraco',
    icon: '🕳️',
    label: 'Buraco',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Iluminação',
    slug: 'iluminacao',
    icon: '💡',
    label: 'Iluminação',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Alagamento',
    slug: 'alagamento',
    icon: '🌧️',
    label: 'Alagamento',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Calçada',
    slug: 'calcada',
    icon: '🚶',
    label: 'Calçada',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Lixo',
    slug: 'lixo',
    icon: '🗑️',
    label: 'Lixo',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Trânsito',
    slug: 'transito',
    icon: '🚦',
    label: 'Trânsito',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Árvore',
    slug: 'arvore',
    icon: '🌳',
    label: 'Árvore',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '8',
    name: 'Acessibilidade',
    slug: 'acessibilidade',
    icon: '♿',
    label: 'Acessibilidade',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '9',
    name: 'Obra',
    slug: 'obra',
    icon: '🏗️',
    label: 'Obra',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '10',
    name: 'Outro',
    slug: 'outro',
    icon: '📍',
    label: 'Outro',
    active: true,
    created_at: new Date().toISOString(),
  },
];

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#E53935',
  IMPROVING: '#FDD835',
  RESOLVED: '#43A047',
  ARCHIVED: '#9E9E9E',
};

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Em acompanhamento',
  IMPROVING: 'Em melhoria',
  RESOLVED: 'Resolvido',
  ARCHIVED: 'Arquivado',
};

export const UPDATE_STATUS_LABELS: Record<string, string> = {
  SAME: 'Continua igual',
  WORSE: 'Piorou',
  BETTER: 'Melhorou',
  RESOLVED: 'Foi resolvido',
};

export const UPDATE_STATUS_COLORS: Record<string, string> = {
  SAME: '#E53935',
  WORSE: '#FF9800',
  BETTER: '#FDD835',
  RESOLVED: '#43A047',
};

export const RELATION_TYPE_LABELS: Record<string, string> = {
  DUPLICATE: 'Duplicado',
  RELATED: 'Relacionado',
  CONTINUATION: 'Continuação',
};

export const RESOLUTION_CONFIRMATION_THRESHOLD = 3;

export const DEFAULT_MAP_REGION = {
  latitude: -23.5505,
  longitude: -46.6333,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
export const MAX_PHOTOS_PER_REPORT = 5;
export const MAX_DESCRIPTION_LENGTH = 1000;
export const MAX_UPDATE_DESCRIPTION_LENGTH = 500;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const ANONYMOUS_ID_KEY = 'cidade_anonymous_id';