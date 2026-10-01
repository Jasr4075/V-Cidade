import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useCategories } from '@/hooks/useReports';
import { useAnonymousId } from '@/hooks/useReports';
import { useLocation } from '@/hooks/useLocation';
import { useNearbyReports } from '@/hooks/useReports';
import { CategoryGrid } from '@/components/CategoryGrid';
import { ReportCard } from '@/components/ReportCard';
import { MapViewComponent } from '@/components/MapView';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Button } from '@/components/Button';
import { DEFAULT_MAP_REGION } from '@/constants';
import { formatRelativeTime } from '@/utils';

export default function HomeScreen() {
  const { anonymousId, loading: anonLoading } = useAnonymousId();
  const { categories, loading: catLoading, error: catError, refresh: refreshCategories } = useCategories();
  const { coordinates: userLocation, loading: locLoading, permissionGranted } = useLocation();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState(DEFAULT_MAP_REGION);
  const [showMap, setShowMap] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { reports, loading: reportsLoading, error: reportsError, refresh: refreshReports } = useNearbyReports(
    userLocation?.latitude || DEFAULT_MAP_REGION.latitude,
    userLocation?.longitude || DEFAULT_MAP_REGION.longitude,
    {
      radius: 5000,
      category_id: selectedCategoryId,
      enabled: !!userLocation,
    }
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshCategories(), refreshReports()]);
    setRefreshing(false);
  }, [refreshCategories, refreshReports]);

  const handleCategoryPress = (category: { id: string }) => {
    if (selectedCategoryId === category.id) {
      setSelectedCategoryId(null);
    } else {
      setSelectedCategoryId(category.id);
    }
    router.push(`/report/new?category=${category.id}`);
  };

  const handleReportPress = (report: { id: string }) => {
    router.push(`/report/${report.id}`);
  };

  const handleMapRegionChange = (region: typeof mapRegion) => {
    setMapRegion(region);
  };

  if (anonLoading) {
    return <LoadingState message="Iniciando..." />;
  }

  const hasReports = reports.length > 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Mapa da Cidade</Text>
        <Text style={styles.subtitle}>
          Você não precisa criar uma conta. Suas contribuições são feitas de forma anônima.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categorias</Text>
        {catLoading ? (
          <LoadingState size="small" style={styles.inlineLoading} />
        ) : catError ? (
          <ErrorState message={catError} onRetry={refreshCategories} retryLabel="Tentar novamente" />
        ) : (
          <CategoryGrid
            categories={categories}
            onPressCategory={handleCategoryPress}
          />
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategoryId
              ? categories.find(c => c.id === selectedCategoryId)?.label || 'Problemas'
              : 'Problemas próximos'}
          </Text>
          <TouchableOpacity
            style={styles.mapToggle}
            onPress={() => setShowMap(!showMap)}
          >
            <Text style={styles.mapToggleText}>
              {showMap ? 'Ver lista' : 'Ver mapa'}
            </Text>
          </TouchableOpacity>
        </View>

        {showMap ? (
          <View style={styles.mapContainer}>
            {reportsLoading ? (
              <LoadingState message="Carregando mapa..." />
            ) : reportsError ? (
              <ErrorState message={reportsError} onRetry={refreshReports} />
            ) : (
              <MapViewComponent
                reports={reports}
                region={mapRegion}
                onRegionChange={handleMapRegionChange}
                onPressMarker={handleReportPress}
                categoryFilter={selectedCategoryId}
                userLocation={userLocation}
                style={styles.map}
              />
            )}
          </View>
        ) : (
          reportsLoading ? (
            <LoadingState message="Carregando problemas..." />
          ) : reportsError ? (
            <ErrorState message={reportsError} onRetry={refreshReports} />
          ) : hasReports ? (
            <>
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onPress={() => handleReportPress(report)}
                  userLocation={userLocation}
                />
              ))}
            </>
          ) : (
            <EmptyState
              icon="🎉"
              title="Nenhum problema por perto"
              description="Seja o primeiro a registrar algo na sua região!"
              actionLabel="Registrar problema"
              onAction={() => router.push('/report/new')}
              style={styles.emptyState}
            />
          )
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Mapa da Cidade • Dados de demonstração
        </Text>
      </View>
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
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  mapToggle: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  mapToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  mapContainer: {
    marginHorizontal: -16,
    marginTop: 8,
  },
  map: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyState: {
    marginTop: 32,
  },
  inlineLoading: {
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});