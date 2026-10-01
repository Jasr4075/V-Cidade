import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Alert, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useReport } from '@/hooks/useReports';
import { useReportUpdates } from '@/hooks/useReports';
import { useReportRelations } from '@/hooks/useReports';
import { useResolutionConfirmation } from '@/hooks/useReports';
import { useAnonymousId } from '@/hooks/useReports';
import { useSupportReport } from '@/hooks/useReports';
import { ReportStatusBadge } from '@/components/ReportStatus';
import { Timeline } from '@/components/Timeline';
import { SupportButton } from '@/components/SupportButton';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { ReportRelationModal } from '@/components/ReportRelationModal';
import { formatRelativeTime, getStatusColor } from '@/utils';
import { STATUS_LABELS, UPDATE_STATUS_LABELS, RELATION_TYPE_LABELS } from '@/constants';
import { Report } from '@/types';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { anonymousId, loading: anonLoading } = useAnonymousId();
  const { report, loading: reportLoading, error: reportError, refresh: refreshReport } = useReport(id!, anonymousId);
  const { updates, loading: updatesLoading, addUpdate, refresh: refreshUpdates } = useReportUpdates(id!);
  const { relations, loading: relationsLoading, addRelation, refresh: refreshRelations } = useReportRelations(id!);
  const { confirmed, count, resolved, loading: confirmLoading, confirm, refresh: refreshConfirm } = useResolutionConfirmation(id!, anonymousId);
  const { supported, supportsCount, loading: supportLoading, toggleSupport } = useSupportReport(id!, anonymousId);

  const [showRelationModal, setShowRelationModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showInappropriateModal, setShowInappropriateModal] = useState(false);
  const [selectedUpdateStatus, setSelectedUpdateStatus] = useState<'SAME' | 'WORSE' | 'BETTER' | 'RESOLVED'>('SAME');
  const [updateDescription, setUpdateDescription] = useState('');
  const [updatePhotos, setUpdatePhotos] = useState<Array<{ uri: string }>>([]);

  if (anonLoading || reportLoading) {
    return <LoadingState message="Carregando problema..." />;
  }

  if (reportError || !report) {
    return (
      <ErrorState
        message={reportError || 'Problema não encontrado'}
        onRetry={refreshReport}
      />
    );
  }

  const statusColor = getStatusColor(report.status);

  const handleSupport = async () => {
    const newSupported = await toggleSupport(supportsCount);
    if (newSupported !== supported) {
      refreshReport();
      refreshConfirm();
    }
  };

  const handleConfirmResolution = async () => {
    const success = await confirm();
    if (success) {
      refreshReport();
      refreshConfirm();
      refreshUpdates();
    }
  };

  const handleInappropriate = () => {
    Alert.alert(
      'Denunciar conteúdo',
      'Tem certeza que deseja denunciar este problema como conteúdo inadequado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Denunciar', style: 'destructive', onPress: () => {
          // TODO: Implement report inappropriate
          Alert.alert('Obrigado', 'Sua denúncia foi registrada e será analisada.');
        }},
      ]
    );
  };

  const handleOpenInMaps = () => {
    const [longitude, latitude] = report.location.coordinates;
    const url = Platform.OS === 'ios'
      ? `maps://?q=${latitude},${longitude}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.categoryRow}>
          <Text style={styles.categoryIcon}>{report.category?.icon || '📍'}</Text>
          <Text style={styles.categoryName}>{report.category?.label || report.category_id}</Text>
        </View>
        <ReportStatusBadge status={report.status} size="large" confirmationsCount={count} />
      </View>

      <Text style={styles.title}>{report.title}</Text>

      <View style={styles.locationRow}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationText}>
          {report.location.coordinates[1].toFixed(6)}, {report.location.coordinates[0].toFixed(6)}
        </Text>
        <TouchableOpacity style={styles.openMapsButton} onPress={handleOpenInMaps}>
          <Text style={styles.openMapsButtonText}>Abrir no mapa</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{report.supports_count || 0}</Text>
          <Text style={styles.statLabel}>apoios</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{updates.length}</Text>
          <Text style={styles.statLabel}>atualizações</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatRelativeTime(report.updated_at)}</Text>
          <Text style={styles.statLabel}>atualizado</Text>
        </View>
      </View>

      <SupportButton
        supported={supported}
        count={report.supports_count || 0}
        loading={supportLoading}
        onPress={handleSupport}
      />

      <View style={styles.actionRow}>
        <Button
          title={confirmed ? 'Você confirmou' : 'Confirmar resolução'}
          onPress={handleConfirmResolution}
          variant={confirmed ? 'secondary' : 'primary'}
          disabled={confirmed || resolved || confirmLoading}
          loading={confirmLoading}
          style={styles.actionButton}
        />
        <Button
          title="Atualizar situação"
          onPress={() => setShowUpdateModal(true)}
          variant="outline"
          style={styles.actionButton}
        />
      </View>

      <View style={styles.actionRow}>
        <Button
          title="Relacionar registro"
          onPress={() => setShowRelationModal(true)}
          variant="outline"
          style={styles.actionButton}
        />
        <Button
          title="Denunciar conteúdo"
          onPress={handleInappropriate}
          variant="outline"
          style={{ ...styles.actionButton, ...styles.dangerButton }}
        />
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Histórico</Text>
      <Timeline
        updates={updates}
        initialReport={{
          title: report.title,
          created_at: report.created_at,
        }}
      />

      {relations.length > 0 && (
        <>
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Registros relacionados</Text>
          {relations.map((relation) => (
            <View key={relation.id} style={styles.relationItem}>
              <Text style={styles.relationType}>
                {RELATION_TYPE_LABELS[relation.relation_type]}
              </Text>
              <View style={styles.relationInfo}>
                <Text style={styles.relationTitle}>{relation.related_report?.title}</Text>
                <Text style={styles.relationMeta}>
                  {relation.related_report?.category?.label} • {relation.related_report?.supports_count || 0} apoios
                </Text>
              </View>
            </View>
          ))}
        </>
      )}

      {resolved && (
        <>
          <View style={styles.divider} />
          <View style={styles.resolvedSection}>
            <Text style={styles.resolvedIcon}>🟢</Text>
            <Text style={styles.resolvedTitle}>Problema resolvido</Text>
            <Text style={styles.resolvedText}>
              Confirmado por {count} pessoa{count > 1 ? 's' : ''}.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  locationIcon: {
    fontSize: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  openMapsButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  openMapsButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976D2',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  actionButton: {
    flex: 1,
  },
  dangerButton: {
    backgroundColor: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  relationItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  relationType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  relationInfo: {
    flex: 1,
  },
  relationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  relationMeta: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  resolvedSection: {
    backgroundColor: '#E8F5E9',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  resolvedIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  resolvedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 4,
  },
  resolvedText: {
    fontSize: 15,
    color: '#2E7D32',
    textAlign: 'center',
  },
});