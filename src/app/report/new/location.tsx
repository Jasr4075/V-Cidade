import React, { useState, useCallback } from 'react';
import { router , useLocalSearchParams } from 'expo-router';
import { LocationPicker } from '@/components/LocationPicker';
import { CATEGORIES } from '@/constants';

export default function NewReportLocationScreen() {
  const { category: categoryId } = useLocalSearchParams<{ category: string }>();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState('');

  const category = CATEGORIES.find((c) => c.id === categoryId) ?? CATEGORIES[0];

  const handleLocationSelect = useCallback(
    (coords: { latitude: number; longitude: number }, addr: string) => {
      setLocation(coords);
      setAddress(addr);
    },
    []
  );

  const handleContinue = useCallback(() => {
    if (!location) return;
    router.push({
      pathname: '/report/new/photo',
      params: {
        category: categoryId,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        address,
      },
    });
  }, [location, categoryId, address]);

  return (
    <LocationPicker
      title="Onde está o problema?"
      subtitle="Toque no mapa para marcar o local, ou use a sua localização atual."
      categoryLabel={category.label}
      stepLabel="ETAPA 2 DE 4"
      onBack={() => router.back()}
      onLocationSelect={handleLocationSelect}
      ctaLabel="Continuar para fotos"
      ctaDisabledLabel="Escolha um local no mapa"
      onContinue={handleContinue}
    />
  );
}