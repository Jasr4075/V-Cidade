import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LocationPicker } from '@/components/LocationPicker';
import { Button } from '@/components/Button';
import { LoadingState } from '@/components/LoadingState';
import { Category } from '@/types';
import { CATEGORIES } from '@/constants';

export default function NewReportLocationScreen() {
  const { category: categoryId } = useLocalSearchParams<{ category: string }>();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState('');
  const category = CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];

  const handleLocationSelect = (coords: { latitude: number; longitude: number }, addr: string) => {
    setLocation(coords);
    setAddress(addr);
  };

  const handleContinue = () => {
    if (!location) {
      Alert.alert('Selecione uma localização', 'Toque no mapa ou use sua localização atual');
      return;
    }
    router.push({
      pathname: '/report/new/photo',
      params: {
        category: categoryId,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        address,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Localização</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.categoryBadge}>
        <Text style={styles.categoryBadgeIcon}>{category.icon}</Text>
        <Text style={styles.categoryBadgeText}>{category.label}</Text>
      </View>

      <LocationPicker
        title="Onde está o problema?"
        onLocationSelect={handleLocationSelect}
        onCancel={() => router.back()}
      />

      <View style={styles.bottomButton}>
        <Button
          title={location ? 'Continuar para foto' : 'Selecionar localização'}
          onPress={handleContinue}
          variant={location ? 'primary' : 'outline'}
          disabled={!location}
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
  bottomButton: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});