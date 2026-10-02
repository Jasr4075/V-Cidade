/**
 * Breakpoints e regras de layout responsivo.
 *
 * UM único lugar decide "que tamanho de tela é este". Nenhum componente deve
 * comparar `width >= 700` sozinho: números soltos se espalham, divergem e
 * viram comportamento inconsistente entre telas.
 *
 * A escala é mobile-first: cada tier é o *mínimo* de largura a partir do qual
 * uma regra passa a valer.
 */
import type { DimensionValue } from 'react-native';

/**
 * Escalas de largura em px (menor largura do viewport).
 */
export const BREAKPOINTS = {
  /** 320–359: celulares muito pequenos (iPhone SE 1ª gen, Galaxy Fold fechado) */
  compact: 0,
  /** ≥360: base moderna de celular */
  phone: 360,
  /** ≥600: celular grande / celular em paisagem */
  phoneLarge: 600,
  /** ≥768: tablet em retrato */
  tablet: 768,
  /** ≥1024: tablet em paisagem / notebook */
  laptop: 1024,
  /** ≥1280: desktop */
  desktop: 1280,
  /** ≥1536: desktop grande */
  wide: 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

/** Tiers legíveis — Preferir estes a comparações numéricas. */
export type SizeTier = 'compact' | 'phone' | 'phoneLarge' | 'tablet' | 'laptop' | 'desktop' | 'wide';

/**
 * Larguras mínimas (px) para virar 1 coluna de verdade. Usado por
 * `columnsFor()` em grids de cartões e listas — o número de colunas sai do
 * espaço disponível, nunca de um literal solto no componente.
 */
export const GRID_ITEM_MIN_WIDTH = {
  /** Card de ocorrência: precisa caber título + status + 3 linhas. */
  reportCard: 288,
  /** Tile de categoria: ícone de 56px + rótulo de 2 linhas. */
  categoryTile: 104,
  /** Card compacto (lista do mapa web). */
  compactCard: 300,
} as const;

/**
 * Regras de layout por tier. Tudo que depende do tamanho da tela vive aqui.
 */
export const RESPONSIVE_LAYOUT = {
  /** Largura máxima da coluna de conteúdo — evita linhas quilométricas. */
  maxContentWidth: {
    compact: 640,
    phone: 640,
    phoneLarge: 680,
    tablet: 720,
    laptop: 840,
    desktop: 960,
    wide: 1040,
  },
  /**
   * Altura do mapa. Em telas maiores o mapa cresce, mas nunca vira a tela
   * inteira — o usuário precisa continuar vendo o contexto.
   */
  mapHeight: {
    compact: 260,
    phone: 280,
    phoneLarge: 300,
    tablet: 340,
    laptop: 420,
    desktop: 520,
    wide: 580,
  },
  /**
   * Colunas da lista de ocorrências. `null` = 1 coluna.
   * Reportado aqui em vez de calculado no componente para que Home, Web e
   * qualquer painel lateral compartilhem exatamente a mesma regra.
   */
  reportColumns: {
    compact: 1,
    phone: 1,
    phoneLarge: 1,
    tablet: 2,
    laptop: 2,
    desktop: 3,
    wide: 3,
  },
  /** Colunas do grid de categorias. */
  categoryColumns: {
    compact: 3,
    phone: 3,
    phoneLarge: 4,
    tablet: 4,
    laptop: 5,
    desktop: 5,
    wide: 6,
  },
  /** Margem lateral da página: acompanha o viewport, com teto. */
  gutter: {
    compact: 12,
    phone: 16,
    phoneLarge: 20,
    tablet: 24,
    laptop: 32,
    desktop: 40,
    wide: 48,
  },
} as const;

/** Largura máxima dos diálogos (modais) — nunca a tela inteira no desktop. */
export const DIALOG_WIDTH: Record<SizeTier, DimensionValue> = {
  compact: '100%',
  phone: '100%',
  phoneLarge: 520,
  tablet: 560,
  laptop: 600,
  desktop: 600,
  wide: 600,
};

/**
 * Alturas mínimas de alvo de toque por tier. Em telas com mouse (desktop) os
 * alvos podem ser um pouco menores sem prejuízo, mas nunca abaixo de 40px —
 * WCAG 2.2 pede 24px e o app adota 48px no toque.
 */
export const TOUCH_TARGET = {
  mobile: 48,
  desktop: 40,
} as const;

const TIER_ORDER: SizeTier[] = [
  'compact',
  'phone',
  'phoneLarge',
  'tablet',
  'laptop',
  'desktop',
  'wide',
];

/** Descobre o tier correspondente a uma largura de viewport. */
export function tierForWidth(width: number): SizeTier {
  let tier: SizeTier = 'compact';
  for (const candidate of TIER_ORDER) {
    if (width >= BREAKPOINTS[candidate]) tier = candidate;
  }
  return tier;
}

/**
 * Quantas colunas cabem em `availableWidth` mantendo cada item com pelo menos
 * `minItemWidth`. Garante ao menos 1 coluna mesmo em telas minúsculas.
 */
export function columnsFor(availableWidth: number, minItemWidth: number, gap = 0): number {
  if (availableWidth <= 0 || minItemWidth <= 0) return 1;
  // (w + gap) / (min + gap) — a conta já desconta os vãos entre colunas.
  const columns = Math.floor((availableWidth + gap) / (minItemWidth + gap));
  return Math.max(1, columns);
}

/**
 * Largura de cada item de um grid flex-wrap, em porcentagem.
 *
 * O vão entre colunas sai do `paddingRight` do próprio item, e não de um
 * `calc(100% / n - 12px)`: o Yoga (e o react-native-web) não entende `calc()`,
 * e subtrair espaço fixo quebra quando o contêiner não tem largura conhecida.
 */
export function columnWidthPercent(columns: number): DimensionValue {
  return `${100 / Math.max(1, Math.floor(columns))}%`;
}

/**
 *_altura útil_ da janela, descontando o que já está sendo usado.
 * Usado para que o mapa nunca empurre conteúdo para fora da tela.
 */
export function availableHeight(
  windowHeight: number,
  topInset: number,
  bottomInset: number,
  reserved = 0
): number {
  return Math.max(180, windowHeight - topInset - bottomInset - reserved);
}
