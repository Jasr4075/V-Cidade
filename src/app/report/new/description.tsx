import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Keyboard, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useCreateReport } from '@/hooks/useReports';
import { useCheckDuplicates } from '@/hooks/useReports';
import { useAnonymousId } from '@/hooks/useReports';
import { Button } from '@/components/Button';
import { Category } from '@/types';
import { CATEGORIES } from '@/constants';
import { MAX_DESCRIPTION_LENGTH } from '@/constants';
import { validateDescription } from '@/utils';

export default function NewReportDescriptionScreen() {
  const { category: categoryId, latitude, longitude, address, photos } = useLocalSearchParams<{
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

  const category = CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
  const coords = { latitude: parseFloat(latitude!), longitude: parseFloat(longitude!) };
  const photoUris = photos ? JSON.parse(photos) : [];

  const handleDescriptionChange = useCallback((text: string) => {
    setDescription(text);
    const error = validateDescription(text, MAX_DESCRIPTION_LENGTH);
    setDescriptionError(error);
  }, []);

  const handleSubmit = async () => {
    const error = validateDescription(description, MAX_DESCRIPTION_LENGTH);
    if (error) {
      setDescriptionError(error);
      return;
    }

    if (!checkedDuplicates && !showDuplicates) {
      setShowDuplicates(true);
      return;
    }

    const report = await create(
      categoryId,
      category.label,
      description,
      coords.latitude,
      coords.longitude,
      anonymousId
    );

    if (report) {
      router.replace(`/report/${report.id}`);
    } else if (createError) {
      Alert.alert('Erro', createError);
    }
  };

  const handleCheckDuplicates = async () => {
    const results = await check(categoryId, coords.latitude, coords.longitude, 100);
    if (results.length > 0) {
      setShowDuplicates(true);
    } else {
      setCheckedDuplicates(true);
      handleSubmit();
    }
  };

  const handleIgnoreDuplicates = () => {
    setCheckedDuplicates(true);
    setShowDuplicates(false);
    handleSubmit();
  };

  if (anonLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Iniciando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Descrição</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.categoryBadge}>
        <Text style={styles.categoryBadgeIcon}>{category.icon}</Text>
        <Text style={styles.categoryBadgeText}>{category.label}</Text>
      </View>

      <View style={styles.locationInfo}>
        <Text style={styles.locationLabel}>📍 {address}</Text>
      </View>

      {photoUris.length > 0 && (
        <View style={styles.photoPreview}>
          {photoUris.slice(0, 3).map((uri: string, index: number) => (
            <View key={index} style={styles.photoThumb}>
              {/* Photo thumbnail */}
            </View>
          ))}
        </View>
      )}

      <View style={styles.descriptionSection}>
        <Text style={styles.label}>Descreva o problema *</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={6}
          placeholder="Ex: Buraco grande na esquina com a Rua X, perigo para motos e carros..."
          value={description}
          onChangeText={handleDescriptionChange}
          maxLength={MAX_DESCRIPTION_LENGTH}
          placeholderTextColor="#999"
        />
        <View style={styles.inputFooter}>
          {descriptionError ? (
            <Text style={styles.errorText}>{descriptionError}</Text>
          ) : (
            <Text style={styles.charCount}>
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </Text>
          )}
        </View>
      </View>

      {showDuplicates && duplicates.length > 0 && (
        <View style={styles.duplicateWarning}>
          <Text style={styles.duplicateTitle}>⚠️ Problemas semelhantes próximos</Text>
          <Text style={styles.duplicateText}>
            Encontramos {duplicates.length} problema{duplicates.length > 1 ? 's' : ''} da mesma categoria perto deste local:
          </Text>
          {duplicates.slice(0, 3).map((dup) => (
            <TouchableOpacity key={dup.report.id} style={styles.duplicateItem} onPress={() => router.push(`/report/${dup.report.id}`)}>
              <Text style={styles.duplicateItemTitle}>{dup.report.title}</Text>
              <Text style={styles.duplicateItemMeta}>
                {dup.report.category?.label} • {formatDistance(dup.distance)} daqui • {dup.report.supports_count || 0} apoios
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.duplicateActions}>
            <Button title="Ver todos" onPress={() => router.push('/search')} variant="outline" style={styles.duplicateButton} />
            <Button title="Registrar mesmo assim" onPress={handleIgnoreDuplicates} variant="danger" style={styles.duplicateButton} />
          </View>
        </View>
      )}

      <View style={styles.bottomButton}>
        <Button
          title={showDuplicates && !checkedDuplicates ? 'Registrar mesmo assim' : 'Registrar problema'}
          onPress={showDuplicates && !checkedDuplicates ? handleIgnoreDuplicates : handleSubmit}
          variant="primary"
          loading={createLoading || duplicateLoading}
          disabled={createLoading || duplicateLoading}
          size="large"
          fullWidth
        />
      </View>
    </View>
  );
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: '600',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  headerSpacer: {
    width: 48,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
  },
  categoryBadgeIcon: {
    fontSize: 20,
  },
  categoryBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  locationInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  photoPreview: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  photoThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  descriptionSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    minHeight: 140,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#E53935',
  },
  charCount: {
    fontSize: 13,
    color: '#999',
  },
  duplicateWarning: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFD54F',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  duplicateTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F57F17',
    marginBottom: 8,
  },
  duplicateText: {
    fontSize: 14,
    color: '#F57F17',
    marginBottom: 12,
  },
  duplicateItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  duplicateItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  duplicateItemMeta: {
    fontSize: 12,
    color: '#666',
  },
  duplicateActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  duplicateButton: {
    flex: 1,
  },
  bottomButton: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});