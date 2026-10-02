import { Platform } from 'react-native';

/**
 * Design tokens do Mapa da Cidade.
 * Toda a interface deve consumir estes tokens — nunca literais hex avulsos.
 */

export const palette = {
  // Marca / ação primária
  blue50: '#EEF4FF',
  blue100: '#DCE7FE',
  blue200: '#C0D4FD',
  blue300: '#94B8FB',
  blue500: '#2F6BE0',
  blue600: '#1D53C4',
  blue700: '#17429C',
  blue900: '#10265A',

  // Neutros
  white: '#FFFFFF',
  gray50: '#F7F8FA',
  gray100: '#EEF0F4',
  gray200: '#E1E5EC',
  gray300: '#CBD2DD',
  gray400: '#8994A6',
  gray500: '#6B7688',
  gray600: '#4E5867',
  gray700: '#39404C',
  gray800: '#252A33',
  gray900: '#14171C',

  // Semânticos
  green600: '#1B7F4B',
  green100: '#DCF5E7',
  green50: '#EFFAF3',

  amber700: '#96590A',
  amber600: '#B36B00',
  amber100: '#FDEFD4',
  amber50: '#FFF8EC',

  red700: '#B3261E',
  red600: '#C4342B',
  red100: '#FBE0DE',
  red50: '#FEF3F2',

  violet600: '#6B3FC4',
  violet100: '#EDE5FB',

  teal600: '#0F7A75',
  teal100: '#D6F1EF',
} as const;

/**
 * Cores semânticas. Estados NUNCA são comunicados só por cor:
 * todo badge de status carrega ícone + rótulo textual.
 */
export const colors = {
  // Superfícies
  background: palette.gray50,
  surface: palette.white,
  surfaceMuted: palette.gray50,
  surfaceSunken: palette.gray100,

  // Texto — hierarquia de 3 níveis, todos medidos e aprovados em WCAG AA
  text: palette.gray900,          // 17.96:1 em white
  textSecondary: palette.gray700, // 10.44:1 em white
  textMuted: palette.gray600,     //  7.20:1 em white
  textDisabled: palette.gray400,  //  3.07:1 em white (mínimo de elemento não-textual)
  textInverse: palette.white,

  // Marca
  primary: palette.blue600,
  primaryPressed: palette.blue700,
  primarySoft: palette.blue50,
  primaryBorder: palette.blue200,
  onPrimary: palette.white,

  // Bordas
  border: palette.gray200,
  borderStrong: palette.gray300,
  divider: palette.gray100,

  // Feedback
  success: palette.green600,
  successSoft: palette.green50,
  successBorder: palette.green100,
  onSuccessSoft: palette.green600,

  warning: palette.amber700,
  warningSoft: palette.amber50,
  warningBorder: palette.amber100,
  onWarningSoft: palette.amber700,

  danger: palette.red700,
  dangerSoft: palette.red50,
  dangerBorder: palette.red100,
  onDangerSoft: palette.red700,

  info: palette.teal600,
  infoSoft: '#EAF7F6',
  infoBorder: palette.teal100,

  // Focus / acessibilidade
  focus: palette.blue500,

  /** Scrim de modais — precisa de alpha, então vive aqui como token. */
  overlay: 'rgba(20, 23, 28, 0.55)',
  /** Badge sobre miniatura de foto. */
  overlayStrong: 'rgba(20, 23, 28, 0.72)',
} as const;

/** Estados de ocorrência — corSEMPRE acompanhada de ícone e rótulo. */
export type StatusToneKey = 'danger' | 'warning' | 'success' | 'neutral';

export const statusTone: Record<
  StatusToneKey,
  { fg: string; bg: string; border: string }
> = {
  danger: { fg: palette.red700, bg: palette.red50, border: palette.red100 },
  warning: { fg: palette.amber700, bg: palette.amber50, border: palette.amber100 },
  success: { fg: palette.green600, bg: palette.green50, border: palette.green100 },
  neutral: { fg: palette.gray600, bg: palette.gray100, border: palette.gray200 },
};

/** Escala de espaçamento base 4px (proximidade de Gestalt). */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/** Escala tipográfica enxuta — evita excesso de tamanhos diferentes. */
export const fontSize = {
  caption: 12,
  small: 14,
  body: 16,
  title: 18,
  headline: 22,
  display: 28,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeight = {
  tight: 1.25,
  snug: 1.4,
  normal: 1.55,
} as const;

/**
 * Altura mínima de toque. WCAG 2.2 (Target Size, Minimum) pede 24px;
 * usamos 48px para accommodating público diversificado e dedos maiores.
 */
export const HIT_SIZE = 48;

/** Sombra multiplataforma: iOS usa shadow*, Android usa elevation. */
export const shadow = {
  none: {},
  sm: Platform.select({
    ios: {
      shadowColor: '#0B1220',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
    },
    android: { elevation: 1 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#0B1220',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#0B1220',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 20,
    },
    android: { elevation: 8 },
    default: {},
  }),
} as const;

/**
 * Layout base.
 *
 * Estes valores são o *piso* — telas devem usar `useResponsive()` para obter
 * `maxContentWidth`, `mapHeight` e afins já resolvidos para o tier atual.
 * Mantidos aqui para componentes realmente neutros (ex.: skeleton) e para
 * não quebrar nenhum import existente.
 */
export const layout = {
  maxContentWidth: 720,
  mapHeight: 320,
  /** Raio/altura de folha inferior (bottom sheet) em telas grandes. */
  sheetMaxWidth: 640,
  /** Altura máxima de um diálogo antes de virar folha inferior. */
  dialogMaxWidth: 600,
} as const;