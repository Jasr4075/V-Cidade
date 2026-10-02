import React from 'react';
import { View, Image, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MaterialCommunityIcons, ICONS, colors, radii, spacing } from '@/theme';
interface PhotoPreviewProps {
  photos: { uri: string; local?: boolean }[];
  onRemove?: (index: number) => void;
  height?: number;
}

/**
 * Miniaturas das fotos anexadas.
 * O botão de remover tem 32px com `hitSlop`, garantindo alvo de toque efetivo
 * de 48px sem encobrir a imagem.
 */
export const PhotoPreview = ({
  photos,
  onRemove,
  height = 108,
}: PhotoPreviewProps) => {
  if (photos.length === 0) return null;

  // Proporção 4:3, a mesma pedida ao.image picker.
  const photoWidth = Math.round(height * (4 / 3));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      accessibilityLabel={`${photos.length} ${photos.length === 1 ? 'foto anexada' : 'fotos anexadas'}`}
    >
      {photos.map((photo, index) => (
        <View key={`${photo.uri}-${index}`} style={styles.wrapper}>
          <Image
            source={{ uri: photo.uri }}
            style={[styles.photo, { width: photoWidth, height }]}
            resizeMode="cover"
            accessibilityLabel={`Foto ${index + 1} de ${photos.length}`}
          />
          {onRemove ? (
            <Pressable
              onPress={() => onRemove(index)}
              accessibilityRole="button"
              accessibilityLabel={`Remover foto ${index + 1}`}
              hitSlop={8}
              style={({ pressed }: { pressed: boolean }) => [
                styles.remove,
                pressed && styles.removePressed,
              ]}
            >
              <MaterialCommunityIcons name={ICONS.close} size={16} color={colors.textInverse} />
            </Pressable>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
};

PhotoPreview.displayName = 'PhotoPreview';

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  wrapper: {
    position: 'relative',
  },
  photo: {
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSunken,
  },
  remove: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlayStrong,
  },
  removePressed: {
    backgroundColor: colors.danger,
  },
});