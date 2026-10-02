import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Category } from '@/types';
import { useResponsive } from '@/hooks/useResponsive';
import { GRID_ITEM_MIN_WIDTH, columnWidthPercent , MaterialCommunityIcons, getCategoryIcon, colors, radii, spacing, fontSize, fontWeight, lineHeight } from '@/theme';

interface CategoryGridProps {
  categories: Category[];
  onPressCategory: (category: Category) => void;
  /** Realce a categoria que está filtrando a lista. */
  selectedCategoryId?: string | null;
  /**
   * `'auto'` (padrão) decide pelo espaço disponível: rolagem horizontal no
   * celular — que economiza altura e é o padrão esperado em telas estreitas —
   * e grid de verdade a partir de tablet. Passe `'grid'` ou `'horizontal'`
   * para forçar.
   */
  layout?: 'auto' | 'horizontal' | 'grid';
}

/**
 * Categorias como alvos de toque grandes (min. 72px de lado).
 * Rótulo textual sempre visível — o ícone nunca é o único sinal.
 */
export const CategoryGrid = React.memo(
  ({ categories, onPressCategory, selectedCategoryId, layout = 'auto' }: CategoryGridProps) => {
    const responsive = useResponsive();
    const active = useMemo(() => categories.filter((c) => c.active), [categories]);

    // O pai já aplica a margem lateral da página; aqui calculamos apenas a
    // largura que sobra dentro da coluna de conteúdo.
    const innerWidth = Math.max(
      GRID_ITEM_MIN_WIDTH.categoryTile,
      Math.min(responsive.width - responsive.gutter * 2, responsive.maxContentWidth)
    );

    const columns = useMemo(() => {
      const bySpace = responsive.columnsFor(
        innerWidth,
        GRID_ITEM_MIN_WIDTH.categoryTile,
        spacing.sm
      );
      return Math.min(bySpace, responsive.categoryColumns);
    }, [innerWidth, responsive]);

    const mode = layout === 'auto' ? (responsive.isLarge ? 'grid' : 'horizontal') : layout;

    const renderTile = (category: Category, style?: object) => (
      <CategoryTile
        key={category.id}
        category={category}
        selected={category.id === selectedCategoryId}
        onPress={() => onPressCategory(category)}
        style={style}
      />
    );

    if (mode === 'grid') {
      const widthPercent = columnWidthPercent(columns);

      return (
        <View
          style={styles.grid}
          accessibilityRole="list"
          // Uma linha por vez de categories em Tela Leitor, como um conjunto.
          accessibilityLabel={`Categorias, ${columns} por linha`}
        >
          {active.map((category) =>
            renderTile(category, {
              width: widthPercent,
              // O vão é padding do próprio item: o Yoga não entende `calc()`.
              paddingRight: spacing.sm,
            })
          )}
        </View>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        accessibilityRole="list"
      >
        {active.map((category) => renderTile(category))}
      </ScrollView>
    );
  }
);

CategoryGrid.displayName = 'CategoryGrid';

const CategoryTile = React.memo(function CategoryTile({
  category,
  selected = false,
  onPress,
  style,
}: {
  category: Category;
  selected?: boolean;
  onPress: () => void;
  style?: object;
}) {
  const fg = selected ? colors.primary : colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={
        selected ? `${category.label}, filtrando por esta categoria` : category.label
      }
      style={({ pressed }: { pressed: boolean }) => [
        styles.tile,
        selected && styles.tileSelected,
        pressed && styles.tilePressed,
        style,
      ]}
    >
      <View style={[styles.iconWell, selected && styles.iconWellSelected]}>
        <MaterialCommunityIcons
          name={getCategoryIcon(category.slug)}
          size={26}
          color={fg}
        />
      </View>
      <Text
        numberOfLines={2}
        style={[styles.label, { color: selected ? colors.primary : colors.textSecondary }]}
      >
        {category.label}
      </Text>
      {selected ? (
        <View style={styles.checkBadge}>
          <MaterialCommunityIcons name="check" size={12} color={colors.onPrimary} />
        </View>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
    // `paddingRight` para o último tile não encostar na borda da tela quando o
    // usuário rola até o fim.
    paddingRight: spacing.base,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.sm,
  },
  tile: {
    // Largura só no modo de rolagem horizontal (alvo de toque previsível).
    // No grid a largura vem do item pai, proporcional à contagem de colunas.
    width: 92,
    minHeight: 96,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  tilePressed: {
    backgroundColor: colors.surfaceMuted,
  },
  iconWell: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  iconWellSelected: {
    backgroundColor: colors.surface,
  },
  label: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    lineHeight: fontSize.caption * lineHeight.tight,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
});
