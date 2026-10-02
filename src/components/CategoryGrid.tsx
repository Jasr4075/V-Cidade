import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Category } from '@/types';
import { MaterialCommunityIcons, getCategoryIcon, colors, radii, spacing, fontSize, fontWeight, lineHeight } from '@/theme';
interface CategoryGridProps {
  categories: Category[];
  onPressCategory: (category: Category) => void;
  /** Realce a categoria que está filtrando a lista. */
  selectedCategoryId?: string | null;
  /** Modo wrap em grid, para telas com espaço para colunas. */
  layout?: 'horizontal' | 'grid';
}

/**
 * Categorias como alvos de toque grandes (min. 72px de lado).
 * Rótulo textual sempre visível — o ícone nunca é o único sinal.
 */
export const CategoryGrid = React.memo(
  ({ categories, onPressCategory, selectedCategoryId, layout = 'horizontal' }: CategoryGridProps) => {
    const active = categories.filter((c) => c.active);

    if (layout === 'grid') {
      return (
        <View style={styles.grid}>
          {active.map((category) => (
            <CategoryTile
              key={category.id}
              category={category}
              selected={category.id === selectedCategoryId}
              onPress={() => onPressCategory(category)}
              style={styles.gridItem}
            />
          ))}
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
        {active.map((category) => (
          <CategoryTile
            key={category.id}
            category={category}
            selected={category.id === selectedCategoryId}
            onPress={() => onPressCategory(category)}
          />
        ))}
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
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  gridItem: {
    // 4 colunas em telas médias, 3 em pequenas — via porcentagem.
    flexGrow: 1,
    flexBasis: '22%',
    maxWidth: '48%',
  },
  tile: {
    width: 92,
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