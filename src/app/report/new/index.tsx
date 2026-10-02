import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useCategories } from '@/hooks/useReports';
import { usePageContainer, useResponsive } from '@/hooks/useResponsive';
import { Category } from '@/types';
import { CategoryGrid } from '@/components/CategoryGrid';
import { Button } from '@/components/Button';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { MaterialCommunityIcons, getCategoryIcon, colors, radii, spacing, fontSize, fontWeight, lineHeight, HIT_SIZE } from '@/theme';
const CATEGORY_EXAMPLES: Record<string, string> = {
  buraco: 'Buraco grande na rua',
  iluminacao: 'Poste sem luz ou queimado',
  alagamento: 'Rua alagada, água acumulada',
  calcada: 'Calçada quebrada ou irregular',
  lixo: 'Lixo acumulado na rua',
  transito: 'Sinal de trânsito quebrado',
  arvore: 'Árvore caída ou galho baixo',
  acessibilidade: 'Rampa ou piso danificado',
  obra: 'Obra sem sinalização',
  outro: 'Outro tipo de problema',
};

export default function NewReportCategoryScreen() {
  const { category: categoryId } = useLocalSearchParams<{ category?: string }>();
  const { categories, loading, error, refresh } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const responsive = useResponsive();
  const pageContainer = usePageContainer();

  useEffect(() => {
    if (!categoryId) return;
    const found = categories.find((c) => c.slug === categoryId || c.id === categoryId);
    if (found) setSelectedCategory(found);
  }, [categoryId, categories]);

  const handleContinue = useCallback(() => {
    if (!selectedCategory) return;
    router.push(`/report/new/location?category=${selectedCategory.id}`);
  }, [selectedCategory]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);

  if (loading && categories.length === 0) {
    return <LoadingState message="Carregando categorias..." />;
  }

  if (error && categories.length === 0) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        pageContainer,
        { paddingTop: responsive.topInset + spacing.sm, paddingBottom: responsive.bottomInset + spacing.xxl },
      ]}
    >
      <Pressable
        onPress={handleBack}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        style={({ pressed }: { pressed: boolean }) => [
          styles.backButton,
          pressed && styles.backButtonPressed,
        ]}
      >
        <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.step} accessibilityLabel={`Etapa 1 de 4`}>
          ETAPA 1 DE 4
        </Text>
        <Text style={styles.title} accessibilityRole="header">
          Que tipo de problema é?
        </Text>
        <Text style={styles.subtitle}>
          Escolha a categoria que melhor descreve o que você encontrou.
        </Text>
      </View>

      {selectedCategory ? (
        <View style={styles.selectedSection}>
          <View style={styles.selectedCard}>
            <View style={styles.selectedIconWell}>
              <MaterialCommunityIcons
                name={getCategoryIcon(selectedCategory.slug)}
                size={28}
                color={colors.primary}
              />
            </View>
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedLabel} accessibilityRole="header">
                {selectedCategory.label}
              </Text>
              <Text style={styles.selectedExample}>
                {CATEGORY_EXAMPLES[selectedCategory.slug] ?? `Problema de ${selectedCategory.label.toLowerCase()}`}
              </Text>
            </View>
            <Pressable
              onPress={() => setSelectedCategory(null)}
              accessibilityRole="button"
              accessibilityLabel={`Trocar categoria, atualmente ${selectedCategory.label}`}
              hitSlop={8}
              style={({ pressed }: { pressed: boolean }) => [
                styles.changeButton,
                pressed && styles.changeButtonPressed,
              ]}
            >
              <MaterialCommunityIcons name="close" size={18} color={colors.primary} />
            </Pressable>
          </View>

          <Button
            title="Continuar para a localização"
            icon="arrow-right"
            onPress={handleContinue}
            variant="primary"
            size="large"
            style={styles.continueButton}
            accessibilityHint="Vai para a próxima etapa, onde você escolhe o local no mapa"
          />
        </View>
      ) : (
        <CategoryGrid categories={categories} onPressCategory={setSelectedCategory} layout="grid" />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: HIT_SIZE,
    height: HIT_SIZE,
    marginBottom: spacing.sm,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonPressed: {
    backgroundColor: colors.surfaceSunken,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    marginBottom: spacing.lg,
  },
  step: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.text,
    lineHeight: fontSize.display * lineHeight.tight,
  },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: fontSize.body * lineHeight.snug,
  },
  selectedSection: {
    marginTop: spacing.base,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
  },
  selectedIconWell: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  selectedInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  selectedLabel: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  selectedExample: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    lineHeight: fontSize.small * lineHeight.snug,
  },
  changeButton: {
    width: HIT_SIZE,
    height: HIT_SIZE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  changeButtonPressed: {
    backgroundColor: colors.primaryBorder,
  },
  continueButton: {
    marginTop: spacing.base,
  },
});