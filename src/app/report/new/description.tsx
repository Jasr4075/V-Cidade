import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { usePageContainer, useResponsive } from '@/hooks/useResponsive';
import { useCreateReport, useCheckDuplicates, useAnonymousId } from '@/hooks/useReports';
import { PhotoPreview } from '@/components/PhotoPreview';
import { Button } from '@/components/Button';
import { uploadPhoto } from '@/services/storage/storage';
import { MAX_DESCRIPTION_LENGTH } from '@/constants';
import { validateDescription } from '@/utils';
import { MaterialCommunityIcons, ICONS, colors, radii, spacing, fontSize, fontWeight, lineHeight} from '@/theme';
export default function NewReportDescriptionScreen() {
  const { category, latitude, longitude, address, photos } = useLocalSearchParams<{
    category: string;
    latitude: string;
    longitude: string;
    address: string;
    photos: string;
  }>();

  const { anonymousId, loading: anonLoading } = useAnonymousId();
  const { create, loading: createLoading, error: createError } = useCreateReport();
  const { check, loading: duplicateLoading, duplicates } = useCheckDuplicates();

  const [description, setDescription] = useState('');
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [checkedDuplicates, setCheckedDuplicates] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const responsive = useResponsive();
  const pageContainer = usePageContainer();

  const coords = useMemo(
    () => ({ latitude: parseFloat(latitude!), longitude: parseFloat(longitude!) }),
    [latitude, longitude]
  );

  const photoUris = useMemo<{ uri: string }[]>(() => {
    if (!photos) return [];
    try {
      const parsed = JSON.parse(photos);
      return Array.isArray(parsed) ? parsed.map((uri: string) => ({ uri })) : [];
    } catch {
      return [];
    }
  }, [photos]);

  const handleDescriptionChange = useCallback((text: string) => {
    setDescription(text);
    // Validação só aparece depois da primeira interação: não se corrige o
    // usuário enquanto ele ainda está começando a escrever.
    if (text.trim().length > 0) {
      setDescriptionError(validateDescription(text, MAX_DESCRIPTION_LENGTH));
    } else {
      setDescriptionError(null);
    }
  }, []);

  const submit = useCallback(async () => {
    // O título guarda o endereço, não a categoria: a categoria já aparece no
    // card e no detalhe, e um título igual à categoria não diz nada ao leitor.
    const report = await create(
      category!,
      address && address !== 'undefined' && address.trim() ? address : 'Problema reportado',
      description,
      coords.latitude,
      coords.longitude,
      anonymousId
    );
    if (!report) return;

    if (photoUris.length > 0) {
      setUploadingPhotos(true);
      const results = await Promise.allSettled(
        photoUris.map((photo) => uploadPhoto(photo.uri, report.id))
      );
      setUploadingPhotos(false);

      const failed = results.filter((result) => result.status === 'rejected').length;
      if (failed > 0) {
        // O relato já foi salvo: avisar e seguir é melhor que travar o fluxo.
        Alert.alert(
          'Registro salvo',
          `${failed} de ${photoUris.length} ${
            photoUris.length === 1 ? 'foto não pôde ser enviada' : 'fotos não puderam ser enviadas'
          }. O problema foi registrado mesmo assim.`
        );
      }
    }

    router.replace(`/report/${report.id}`);
  }, [category, address, description, coords, anonymousId, create, photoUris]);

  const handleIgnoreDuplicates = useCallback(() => {
    setCheckedDuplicates(true);
    setShowDuplicates(false);
    void submit();
  }, [submit]);

  const handleSubmit = useCallback(async () => {
    const error = validateDescription(description, MAX_DESCRIPTION_LENGTH);
    if (error) {
      setDescriptionError(error);
      return;
    }

    // Na primeira passagem apenas verifica duplicatas; só registra depois.
    if (!checkedDuplicates) {
      const results = await check(category!, coords.latitude, coords.longitude, 100);
      if (results.length > 0) {
        setShowDuplicates(true);
        return;
      }
      setCheckedDuplicates(true);
      await submit();
      return;
    }

    await submit();
  }, [description, checkedDuplicates, check, category, coords, submit]);

  if (anonLoading) {
    return (
      <View style={styles.loading}>
        <MaterialCommunityIcons name={ICONS.inbox} size={32} color={colors.primary} />
        <Text style={styles.loadingText}>Preparando o registro...</Text>
      </View>
    );
  }

  const busy = createLoading || duplicateLoading || uploadingPhotos;
  const duplicatesPending = showDuplicates && !checkedDuplicates;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={[
          pageContainer,
          styles.content,
          { paddingTop: responsive.topInset + spacing.sm, paddingBottom: responsive.bottomInset + 120 },
        ]}
        keyboardShouldPersistTaps="handled"
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
            <Text style={styles.step}>ETAPA 4 DE 4</Text>
            <Text style={styles.title} accessibilityRole="header">
              Descreva o problema
            </Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Quanto mais detalhe, mais rápido alguém entende o que precisa ser feito.
        </Text>

        {address && address !== 'undefined' ? (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.textMuted} />
              <Text style={styles.summaryText} numberOfLines={2}>
                {address}
              </Text>
            </View>
            {photoUris.length > 0 ? (
              <View style={styles.summaryPhotos}>
                <MaterialCommunityIcons name={ICONS.image} size={16} color={colors.textMuted} />
                <Text style={styles.summaryText}>
                  {photoUris.length} {photoUris.length === 1 ? 'foto' : 'fotos'}
                </Text>
                <PhotoPreview photos={photoUris} height={64} />
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label} nativeID="desc-label">
            Descrição <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, descriptionError ? styles.inputError : undefined]}
            multiline
            textAlignVertical="top"
            placeholder="Ex: Buraco grande na esquina, com uns 30 cm de profundidade. Chuva deixa alagado e os carros batem."
            placeholderTextColor={colors.textDisabled}
            value={description}
            onChangeText={handleDescriptionChange}
            maxLength={MAX_DESCRIPTION_LENGTH}
            accessibilityLabel="Descrição do problema"
            accessibilityLabelledBy="desc-label"
          />

          <View style={styles.footerRow}>
            {descriptionError ? (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name={ICONS.alert} size={16} color={colors.danger} />
                <Text style={styles.errorText}>{descriptionError}</Text>
              </View>
            ) : (
              <Text style={styles.helperText}>
                {description.trim().length === 0
                  ? 'Campo obrigatório.'
                  : 'Quanto mais específico, melhor.'}
              </Text>
            )}
            <Text
              style={[
                styles.counter,
                description.length >= MAX_DESCRIPTION_LENGTH && styles.counterFull,
              ]}
            >
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </Text>
          </View>
        </View>

        {duplicatesPending ? (
          <View style={styles.duplicates} accessibilityRole="alert">
            <View style={styles.duplicatesHeader}>
              <MaterialCommunityIcons name={ICONS.alertTriangle} size={20} color={colors.warning} />
              <Text style={styles.duplicatesTitle}>Problemas parecidos por aqui</Text>
            </View>
            <Text style={styles.duplicatesText}>
              Encontramos {duplicates.length}{' '}
              {duplicates.length === 1 ? 'registro' : 'registros'} da mesma categoria perto
              deste local. Confira se o seu caso já foi registrado.
            </Text>

            {duplicates.slice(0, 3).map((dup) => (
              <Pressable
                key={dup.report.id}
                onPress={() => router.push(`/report/${dup.report.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Abrir registro: ${dup.report.title}`}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.duplicateItem,
                  pressed && styles.duplicateItemPressed,
                ]}
              >
                <View style={styles.duplicateInfo}>
                  <Text style={styles.duplicateItemTitle} numberOfLines={1}>
                    {dup.report.title}
                  </Text>
                  <Text style={styles.duplicateItemMeta}>
                    {dup.report.category?.label} · {formatDistance(dup.distance)} ·{' '}
                    {dup.report.supports_count ?? 0} apoios
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={ICONS.chevronRight}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            ))}

            <View style={styles.duplicatesActions}>
              <Pressable
                onPress={handleIgnoreDuplicates}
                accessibilityRole="button"
                accessibilityLabel="Registrar mesmo assim, este é um problema diferente"
                style={({ pressed }: { pressed: boolean }) => [
                  styles.registerAnyway,
                  pressed && styles.registerAnywayPressed,
                ]}
              >
                <Text style={styles.registerAnywayText}>É um problema diferente</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {createError ? (
          <View style={styles.submitError} accessibilityRole="alert">
            <MaterialCommunityIcons name={ICONS.alert} size={18} color={colors.danger} />
            <Text style={styles.submitErrorText}>{createError}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          pageContainer,
          styles.footer,
          { paddingBottom: responsive.bottomInset + spacing.base },
        ]}
      >
        <Button
          title={
            createLoading
              ? 'Registrando...'
              : duplicateLoading
                ? 'Verificando...'
                : uploadingPhotos
                  ? 'Enviando fotos...'
                  : 'Registrar problema'
          }
          icon={busy ? 'clock-outline' : 'check'}
          onPress={handleSubmit}
          variant="primary"
          size="large"
          fullWidth
          loading={busy}
          accessibilityHint="Salva o seu relato no Mapa da Cidade"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return 'distância desconhecida';
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: fontSize.body,
    color: colors.textMuted,
  },

  content: {
    paddingTop: spacing.lg,
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
  subtitle: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    lineHeight: fontSize.small * lineHeight.snug,
    marginTop: spacing.sm,
    marginBottom: spacing.base,
  },

  summaryCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryPhotos: {
    gap: spacing.sm,
  },
  summaryText: {
    flex: 1,
    fontSize: fontSize.small,
    color: colors.textSecondary,
    lineHeight: fontSize.small * lineHeight.snug,
  },

  field: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  required: {
    color: colors.danger,
  },
  input: {
    minHeight: 160,
    padding: spacing.base,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    fontSize: fontSize.body,
    color: colors.text,
    lineHeight: fontSize.body * lineHeight.normal,
  },
  inputError: {
    borderColor: colors.danger,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  helperText: {
    flex: 1,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  errorBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  errorText: {
    flex: 1,
    fontSize: fontSize.caption,
    color: colors.danger,
    fontWeight: fontWeight.medium,
  },
  counter: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  counterFull: {
    color: colors.danger,
    fontWeight: fontWeight.semibold,
  },

  duplicates: {
    marginTop: spacing.lg,
    padding: spacing.base,
    borderRadius: radii.lg,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    gap: spacing.sm,
  },
  duplicatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  duplicatesTitle: {
    flex: 1,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.onWarningSoft,
  },
  duplicatesText: {
    fontSize: fontSize.small,
    color: colors.onWarningSoft,
    lineHeight: fontSize.small * lineHeight.snug,
  },
  duplicateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  duplicateItemPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  duplicateInfo: {
    flex: 1,
    gap: 2,
  },
  duplicateItemTitle: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  duplicateItemMeta: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  duplicatesActions: {
    marginTop: spacing.xs,
  },
  registerAnyway: {
    minHeight: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.warningBorder,
  },
  registerAnywayPressed: {
    backgroundColor: colors.warningBorder,
  },
  registerAnywayText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: colors.warning,
  },

  submitError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.base,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  submitErrorText: {
    flex: 1,
    fontSize: fontSize.small,
    color: colors.onDangerSoft,
    lineHeight: fontSize.small * lineHeight.snug,
  },

  footer: {
    width: '100%',
    paddingTop: spacing.base,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});