import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/Button';
import { PhotoPreview } from '@/components/PhotoPreview';
import { Category } from '@/types';
import { CATEGORIES } from '@/constants';
import { MAX_PHOTOS_PER_REPORT } from '@/constants';

export default function NewReportPhotoScreen() {
  const { category: categoryId, latitude, longitude, address } = useLocalSearchParams<{
    category: string;
    latitude: string;
    longitude: string;
    address: string;
  }>();

  const [photos, setPhotos] = useState<Array<{ uri: string }>>([]);
  const category = CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
  const coords = { latitude: parseFloat(latitude!), longitude: parseFloat(longitude!) };

  const pickImage = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS_PER_REPORT) {
      Alert.alert('Limite atingido', `Máximo de ${MAX_PHOTOS_PER_REPORT} fotos por problema`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, { uri: result.assets[0].uri }]);
    }
  }, [photos.length]);

  const takePhoto = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS_PER_REPORT) {
      Alert.alert('Limite atingido', `Máximo de ${MAX_PHOTOS_PER_REPORT} fotos por problema`);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, { uri: result.assets[0].uri }]);
    }
  }, [photos.length]);

  const removePhoto = useCallback((index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleContinue = () => {
    router.push({
      pathname: '/report/new/description',
      params: {
        category: categoryId,
        latitude: latitude!,
        longitude: longitude!,
        address: address!,
        photos: JSON.stringify(photos.map(p => p.uri)),
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Foto (opcional)</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.categoryBadge}>
        <Text style={styles.categoryBadgeIcon}>{category.icon}</Text>
        <Text style={styles.categoryBadgeText}>{category.label}</Text>
      </View>

      <View style={styles.locationInfo}>
        <Text style={styles.locationLabel}>📍 {address}</Text>
        <Text style={styles.locationCoords}>
          {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
        </Text>
      </View>

      <View style={styles.photoSection}>
        <PhotoPreview photos={photos} onRemove={removePhoto} maxHeight={160} />

        <View style={styles.photoButtons}>
          <TouchableOpacity style={styles.photoButton} onPress={pickImage} disabled={photos.length >= MAX_PHOTOS_PER_REPORT}>
            <Text style={styles.photoButtonIcon}>📷</Text>
            <Text style={styles.photoButtonText}>Galeria</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoButton} onPress={takePhoto} disabled={photos.length >= MAX_PHOTOS_PER_REPORT}>
            <Text style={styles.photoButtonIcon}>📸</Text>
            <Text style={styles.photoButtonText}>Câmera</Text>
          </TouchableOpacity>
        </View>

        {photos.length > 0 && (
          <Text style={styles.photoCount}>
            {photos.length}/{MAX_PHOTOS_PER_REPORT} fotos
          </Text>
        )}
      </View>

      <View style={styles.bottomButton}>
        <Button
          title="Continuar para descrição"
          onPress={handleContinue}
          variant="primary"
          size="large"
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    marginBottom: 2,
  },
  locationCoords: {
    fontSize: 12,
    color: '#666',
  },
  photoSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
  },
  photoButtonIcon: {
    fontSize: 20,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
  photoCount: {
    textAlign: 'center',
    fontSize: 13,
    color: '#666',
  },
  bottomButton: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});