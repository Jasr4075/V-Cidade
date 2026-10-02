import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MAX_PHOTOS_PER_REPORT } from '@/constants';
import { PhotoPreview } from '@/components/PhotoPreview';
import { Button } from '@/components/Button';
import { MaterialCommunityIcons, ICONS, colors, radii, spacing, fontSize, fontWeight, lineHeight, layout } from '@/theme';
export default function NewReportPhotoScreen() {
  const {
    category: categoryId,
    latitude,
    longitude,
    address,
  } = useLocalSearchParams<{
    category: string;
    latitude: string;
    longitude: string;
    address: string;
  }>();

  const [photos, setPhotos] = useState<{ uri: string }[]>([]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 700;

  const atLimit = photos.length >= MAX_PHOTOS_PER_REPORT;

  const addAsset = useCallback((asset?: ImagePicker.ImagePickerAsset) => {
    if (asset?.uri) setPhotos((prev) => [...prev, { uri: asset.uri }]);
  }, []);

  const pickImage = useCallback(async () => {
    if (atLimit) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permissão necessária',
        'Permita o acesso às fotos para anexar imagens ao problema.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) addAsset(result.assets?.[0]);
  }, [atLimit, addAsset]);

  const takePhoto = useCallback(async () => {
    if (atLimit) return;

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permissão necessária',
        'Permita o acesso à câmera para tirar uma foto do problema.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) addAsset(result.assets?.[0]);
  }, [atLimit, addAsset]);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleContinue = useCallback(() => {
    router.push({
      pathname: '/report/new/description',
      params: {
        category: categoryId,
        latitude: latitude!,
        longitude: longitude!,
        address: address!,
        photos: JSON.stringify(photos.map((p) => p.uri)),
      },
    });
  }, [categoryId, latitude, longitude, address, photos]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + spacing.sm },
          isWide && styles.contentWide,
        ]}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={({ pressed }: { pressed: boolean }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <MaterialCommunityIcons name={ICONS.back} size={24} color={colors.text} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.step}>ETAPA 3 DE 4</Text>
            <Text style={styles.title} accessibilityRole="header">
              Adicione fotos
            </Text>
            <Text style={styles.optionalTag}>Opcional</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Uma foto ajuda a equipe a entender o problema. Você pode seguir sem elas.
        </Text>

        {address ? (
          <View style={styles.locationCard}>
            <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.textMuted} />
            <Text style={styles.locationText} numberOfLines={2}>
              {address}
            </Text>
          </View>
        ) : null}

        <View style={styles.photoSection}>
          <View style={styles.photoHeader}>
            <Text style={styles.sectionTitle}>Fotos anexadas</Text>
            <Text style={styles.photoCount}>
              {photos.length} de {MAX_PHOTOS_PER_REPORT}
            </Text>
          </View>

          <PhotoPreview photos={photos} onRemove={removePhoto} />

          {photos.length === 0 ? (
            <View style={styles.emptyPhotos}>
              <MaterialCommunityIcons name={ICONS.image} size={32} color={colors.textMuted} />
              <Text style={styles.emptyPhotosText}>Nenhuma foto adicionada</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Button
              title="Galeria"
              icon={ICONS.image}
              onPress={pickImage}
              variant="outline"
              size="medium"
              disabled={atLimit}
              style={styles.action}
              accessibilityHint="Escolhe uma foto da galeria do aparelho"
            />
            <Button
              title="Câmera"
              icon={ICONS.camera}
              onPress={takePhoto}
              variant="outline"
              size="medium"
              disabled={atLimit}
              style={styles.action}
              accessibilityHint="Tira uma foto do problema agora"
            />
          </View>

          {atLimit ? (
            <View style={styles.limitNotice}>
              <MaterialCommunityIcons name={ICONS.info} size={16} color={colors.textSecondary} />
              <Text style={styles.limitText}>
                Limite de {MAX_PHOTOS_PER_REPORT} fotos atingido. Remova uma para adicionar outra.
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.base }]}>
        <Button
          title="Continuar para descrição"
          icon="arrow-right"
          onPress={handleContinue}
          variant="primary"
          size="large"
          fullWidth
          accessibilityHint="Vai para a última etapa do registro"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
  },
  contentWide: {
    maxWidth: 560,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconButtonPressed: {
    backgroundColor: colors.surfaceSunken,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  step: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: fontSize.headline,
    fontWeight: fontWeight.bold,
    color: colors.text,
    lineHeight: fontSize.headline * lineHeight.tight,
  },
  optionalTag: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSunken,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    overflow: 'hidden',
  },

  subtitle: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    lineHeight: fontSize.small * lineHeight.snug,
    marginTop: spacing.sm,
    marginBottom: spacing.base,
  },

  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  locationText: {
    flex: 1,
    fontSize: fontSize.small,
    color: colors.textSecondary,
    lineHeight: fontSize.small * lineHeight.snug,
  },

  photoSection: {
    flex: 1,
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  photoCount: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },

  emptyPhotos: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceMuted,
  },
  emptyPhotosText: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },

  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.base,
  },
  action: {
    flex: 1,
  },

  limitNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSunken,
  },
  limitText: {
    flex: 1,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    lineHeight: fontSize.caption * lineHeight.snug,
  },

  footer: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});