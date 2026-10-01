import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Category } from '@/types';
import { CategoryButton } from './CategoryButton';

interface CategoryGridProps {
  categories: Category[];
  onPressCategory: (category: Category) => void;
  columns?: number;
  showAll?: boolean;
}

export const CategoryGrid = React.memo(
  ({ categories, onPressCategory, columns = 5, showAll = true }: CategoryGridProps) => {
    const activeCategories = categories.filter(c => c.active);
    const displayCategories = showAll ? activeCategories : activeCategories.slice(0, columns * 2);

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {displayCategories.map((category) => (
          <CategoryButton
            key={category.id}
            category={category}
            onPress={() => onPressCategory(category)}
          />
        ))}
      </ScrollView>
    );
  }
);

CategoryGrid.displayName = 'CategoryGrid';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
});