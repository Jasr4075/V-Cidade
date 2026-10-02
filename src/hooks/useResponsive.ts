import { useMemo } from 'react';
import { useWindowDimensions, type DimensionValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BREAKPOINTS,
  DIALOG_WIDTH,
  GRID_ITEM_MIN_WIDTH,
  RESPONSIVE_LAYOUT,
  TOUCH_TARGET,
  columnsFor,
  tierForWidth,
  type SizeTier,
} from '@/theme/breakpoints';
import { resolveNavigation, type NavStyle } from '@/utils/navigation';

export interface Responsive {
  /** Largura/altura brutas da janela (já reagem a resize no web). */
  width: number;
  height: number;
  tier: SizeTier;
  /** true quando a largura >= altura. */
  isLandscape: boolean;
  isPortrait: boolean;

  /** Tiers — use para decidir estrutura. */
  isCompact: boolean;
  isPhone: boolean;
  isPhoneLarge: boolean;
  isTablet: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  isWide: boolean;

  /** Agrupamentos práticos. */
  /** Celular — layout de coluna única, mapa em lista, botão no rodapé. */
  isMobile: boolean;
  /** Tablet ou maior — cabe grid de 2+ colunas e mapa ao lado. */
  isLarge: boolean;

  /** Valores já resolvidos para o tier atual. */
  maxContentWidth: number;
  mapHeight: number;
  reportColumns: number;
  categoryColumns: number;
  gutter: number;
  dialogWidth: DimensionValue;
  touchTarget: number;

  /**
   * Colunas para um grid, a partir do espaço realmente disponível.
   * Exemplo: `columns(gridRefWidth - gutters, GRID_ITEM_MIN_WIDTH.reportCard)`.
   */
  columnsFor: (availableWidth: number, minItemWidth: number, gap?: number) => number;

  /** Margen lateral padrão da página. */
  horizontalPadding: number;

  /** Áreas seguras do SO, normalizadas (≥ 0) e independentes por lado. */
  insets: { top: number; right: number; bottom: number; left: number };
  topInset: number;
  rightInset: number;
  bottomInset: number;
  leftInset: number;

  /**
   * Navegação inferior do Android: 'gesture' (pílula flutuante) ou 'buttons'
   * (barra clássica). 'none' no iOS e na web (não há barra gerenciável).
   */
  navStyle: NavStyle;
  /** true apenas no Android com navegação por gestos. */
  usesGestures: boolean;
}

/**
 * Fonte única de verdade sobre o tamanho da tela.
 *
 * `useWindowDimensions` funciona igual no Android e no web (no web reage ao
 * redimensionar a janela), então telas não precisam de `Platform.OS` para
 * decidir layout — apenas quando a *implementação* realmente difere.
 */
export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo<Responsive>(() => {
    const tier = tierForWidth(width);
    const isLandscape = width > height;

    // isMobile = cabe um celular na vertical. Landscape de celular pequeno
    // (ex.: 740x360) não deve ganhar o layout de tablet.
    const isMobile = width < BREAKPOINTS.tablet;
    const isLarge = width >= BREAKPOINTS.tablet;

    const gutter = RESPONSIVE_LAYOUT.gutter[tier];
    // O alvo de toque acompanha o dispositivo: com mouse, um alvo um pouco
    // menor continua confortável; no toque, vale o mínimo de 48px.
    const touchTarget = isLarge ? TOUCH_TARGET.desktop : TOUCH_TARGET.mobile;

    // Áreas seguras: só existem no ambiente correspondente (na web são 0).
    // Normaliza para ≥ 0 para não criar paddings negativos.
    const topInset = Math.max(0, insets.top);
    const rightInset = Math.max(0, insets.right);
    const bottomInset = Math.max(0, insets.bottom);
    const leftInset = Math.max(0, insets.left);
    const nav = resolveNavigation(bottomInset);

    return {
      width,
      height,
      tier,
      isLandscape,
      isPortrait: !isLandscape,

      isCompact: tier === 'compact',
      isPhone: width >= BREAKPOINTS.phone && width < BREAKPOINTS.phoneLarge,
      isPhoneLarge: tier === 'phoneLarge',
      isTablet: tier === 'tablet',
      isLaptop: tier === 'laptop',
      isDesktop: tier === 'desktop',
      isWide: tier === 'wide',

      isMobile,
      isLarge,

      maxContentWidth: RESPONSIVE_LAYOUT.maxContentWidth[tier],
      mapHeight: RESPONSIVE_LAYOUT.mapHeight[tier],
      reportColumns: RESPONSIVE_LAYOUT.reportColumns[tier],
      categoryColumns: RESPONSIVE_LAYOUT.categoryColumns[tier],
      gutter,
      dialogWidth: DIALOG_WIDTH[tier],
      touchTarget,

      columnsFor,

      horizontalPadding: gutter + leftInset + rightInset,

      insets: { top: topInset, right: rightInset, bottom: bottomInset, left: leftInset },
      topInset,
      rightInset,
      bottomInset,
      leftInset,

      navStyle: nav.style,
      usesGestures: nav.usesGestures,
    };
  }, [width, height, insets.top, insets.right, insets.bottom, insets.left]);
}

/** Larguras mínimas reexportadas para quem precisar comparar diretamente. */
export { BREAKPOINTS, GRID_ITEM_MIN_WIDTH };
export type { SizeTier };

/**
 * Estilo pronto para o `contentContainerStyle` de uma tela.
 *
 * Centraliza a regra que antes estava repetida (e errada) em cada arquivo:
 * largura máxima por tier, centralizada, com margem lateral somada ao teto —
 * senão o `paddingHorizontal` comeria parte da caixa e a coluna nunca cresceria
 * no desktop, que era exatamente o defeito do `contentWide` antigo.
 */
export function usePageContainer(extra?: { paddingBottom?: number }) {
  const responsive = useResponsive();
  const pad = responsive.gutter;

  return useMemo(
    () => ({
      width: '100%' as const,
      maxWidth: responsive.maxContentWidth + pad * 2,
      alignSelf: 'center' as const,
      paddingLeft: pad,
      paddingRight: pad,
      ...(extra?.paddingBottom !== undefined ? { paddingBottom: extra.paddingBottom } : null),
    }),
    [responsive.maxContentWidth, pad, extra]
  );
}
