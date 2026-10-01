import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useCategories } from '@/hooks/useReports';
import { Category } from '@/types';
import { CategoryGrid } from '@/components/CategoryGrid';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';

export default function NewReportCategoryScreen() {
  const { category: categorySlug } = useLocalSearchParams<{ category?: string }>();
  const { categories, loading, error, refresh } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (categorySlug) {
      const cat = categories.find(c => c.slug === categorySlug || c.id === categorySlug);
      if (cat) {
        setSelectedCategory(cat);
      }
    }
  }, [categorySlug, categories]);

  const handleCategoryPress = (category: Category) => {
    setSelectedCategory(category);
    router.push(`/report/new/location?category=${category.id}`);
  };

  if (loading && categories.length === 0) {
    return <LoadingState message="Carregando categorias..." />;
  }

  if (error && categories.length === 0) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Novo problema</Text>
        <Text style={styles.subtitle}>
          Escolha a categoria do problema que você deseja registrar
        </Text>
      </View>

      {selectedCategory ? (
        <View style={styles.selectedCategory}>
          <View style={styles.selectedCategoryCard}>
            <View style={styles.selectedCategoryIcon}>
              <Text style={styles.selectedCategoryIconText}>{selectedCategory.icon}</Text>
            </View>
            <View style={styles.selectedCategoryInfo}>
              <Text style={styles.selectedCategoryLabel}>{selectedCategory.label}</Text>
              <Text style={styles.selectedCategoryDesc}>
                Registrar problema de {selectedCategory.label.toLowerCase()}
              </Text>
            </View>
            <TouchableOpacity style={styles.changeCategoryButton} onPress={() => setSelectedCategory(null)}>
              <Text style={styles.changeCategoryText}>Alterar</Text>
            </TouchableOpacity>
          </View>
          <Button
            title="Continuar para localização"
            onPress={() => router.push(`/report/new/location?category=${selectedCategory.id}`)}
            variant="primary"
            size="large"
            style={styles.continueButton}
          />
        </View>
      ) : (
        <CategoryGrid
          categories={categories}
          onPressCategory={handleCategoryPress}
          showAll={true}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  selectedCategory: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  selectedCategoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedCategoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCategoryIconText: {
    fontSize: 24,
  },
  selectedCategoryInfo: {
    flex: 1,
  },
  selectedCategoryLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  selectedCategoryDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  changeCategoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changeCategoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  continueButton: {
    marginTop: 24,
    marginHorizontal: 16,
  },
});