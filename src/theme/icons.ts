import { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * Família única de ícones: MaterialCommunityIcons.
 * Todo ícone do app sai daqui — nada de emoji na interface.
 *
 * Regra de UX: o ícone complementa o rótulo, nunca o substitui.
 * Códigos de status sempre exibem ícone + texto (nunca só cor).
 */

/** Categorias: mapeadas por `slug` para não depender do emoji guardado no banco. */
export const CATEGORY_ICONS: Record<string, IconName> = {
  buraco: 'car-wrench',
  iluminacao: 'lightbulb-on-outline',
  alagamento: 'waves',
  calcada: 'road-variant',
  lixo: 'trash-can-outline',
  transito: 'traffic-light',
  arvore: 'tree-outline',
  acessibilidade: 'wheelchair-accessibility',
  obra: 'hammer-wrench',
  outro: 'map-marker-outline',
};

export const CATEGORY_ICON_FALLBACK: IconName = 'map-marker-outline';

export function getCategoryIcon(slug?: string | null): IconName {
  if (!slug) return CATEGORY_ICON_FALLBACK;
  return CATEGORY_ICONS[slug] ?? CATEGORY_ICON_FALLBACK;
}

/** Status de ocorrência — ícone + rótulo, cor apenas reforça. */
export const STATUS_ICONS = {
  ACTIVE: 'progress-wrench',
  IMPROVING: 'progress-clock',
  RESOLVED: 'check-circle-outline',
  ARCHIVED: 'archive-outline',
} as const satisfies Record<string, IconName>;

/** Situação reportada numa atualização. */
export const UPDATE_STATUS_ICONS = {
  SAME: 'minus-circle-outline',
  WORSE: 'trending-up',
  BETTER: 'trending-down',
  RESOLVED: 'check-circle-outline',
} as const satisfies Record<string, IconName>;

/** Navegação e ações. */
export const ICONS = {
  back: 'chevron-left',
  close: 'close',
  check: 'check',
  chevronRight: 'chevron-right',
  chevronDown: 'chevron-down',

  map: 'map-outline',
  list: 'format-list-bulleted',
  layers: 'layers-outline',
  myLocation: 'crosshairs-gps',
  navigation: 'navigation-variant-outline',

  plus: 'plus',
  camera: 'camera-outline',
  image: 'image-multiple-outline',
  imagePlus: 'image-plus',
  trash: 'trash-can-outline',

  thumbUp: 'thumb-up-outline',
  thumbUpFilled: 'thumb-up',
  share: 'share-variant-outline',
  link: 'link-variant',
  openInMaps: 'open-in-new',

  alert: 'alert-circle-outline',
  alertTriangle: 'alert',
  info: 'information-outline',
  help: 'help-circle-outline',
  empty: 'map-search-outline',
  wifiOff: 'wifi-off',

  refresh: 'refresh',
  edit: 'pencil-outline',
  history: 'history',
  linkVariant: 'link-variant',
  flag: 'flag-outline',
  sparkle: 'auto-fix',
  clock: 'clock-outline',
  eye: 'eye-outline',
  search: 'magnify',
  filter: 'filter-variant',
  inbox: 'inbox-arrow-down-outline',
} as const satisfies Record<string, IconName>;

export type StatusIconKey = keyof typeof STATUS_ICONS;
export type UpdateStatusIconKey = keyof typeof UPDATE_STATUS_ICONS;
export type ActionIconKey = keyof typeof ICONS;

export { MaterialCommunityIcons };