import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Category } from '@/types';

interface CategoryButtonProps {
  category: Category;
  onPress: () => void;
  style?: ViewStyle;
}

export const CategoryButton = React.memo(
  ({ category, onPress, style }: CategoryButtonProps) => {
    return (
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={onPress}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`Categoria ${category.label}`}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{category.icon}</Text>
        </View>
        <Text style={styles.label}>{category.label}</Text>
      </TouchableOpacity>
    );
  }
);

CategoryButton.displayName = 'CategoryButton';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    minWidth: 80,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A1A1A',
    textAlign: 'center',
  },
});