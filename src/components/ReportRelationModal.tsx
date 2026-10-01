import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableWithoutFeedback, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from './Button';
import { Report, RelationType } from '@/types';
import { RELATION_TYPE_LABELS } from '@/constants';

interface ReportRelationModalProps {
  visible: boolean;
  currentReport: Report;
  onClose: () => void;
  onRelate: (relatedReportId: string, type: RelationType) => void;
  searchReports: (query: string) => Promise<Report[]>;
}

export const ReportRelationModal = ({
  visible,
  currentReport,
  onClose,
  onRelate,
  searchReports,
}: ReportRelationModalProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<RelationType>('DUPLICATE');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await searchReports(text);
      setResults(data.filter(r => r.id !== currentReport.id));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReport = (report: Report) => {
    setSelectedReport(report);
  };

  const handleConfirm = () => {
    if (selectedReport) {
      onRelate(selectedReport.id, selectedType);
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={true} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View style={styles.modalContainer}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Relacionar problema</Text>
            <Text style={styles.subtitle}>Selecione o tipo de relação</Text>
          </View>

          <View style={styles.typeSelector}>
            {(['DUPLICATE', 'RELATED', 'CONTINUATION'] as RelationType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeOption,
                  selectedType === type && styles.typeOptionSelected,
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[
                  styles.typeOptionText,
                  selectedType === type && styles.typeOptionTextSelected,
                ]}>
                  {RELATION_TYPE_LABELS[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar problema (título, descrição...)"
              value={query}
              onChangeText={handleSearch}
              autoFocus
            />
          </View>

          <Text style={styles.resultsTitle}>
            {loading ? 'Buscando...' : results.length > 0 ? `${results.length} resultado(s)` : 'Nenhum resultado'}
          </Text>

          <ScrollView style={[styles.resultsList, { maxHeight: 300 }]}>
            {results.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={[
                  styles.resultItem,
                  selectedReport?.id === report.id && styles.resultItemSelected,
                ]}
                onPress={() => handleSelectReport(report)}
              >
                <View style={styles.resultInfo}>
                  <Text style={styles.resultCategory}>
                    {report.category?.icon || '📍'} {report.category?.label}
                  </Text>
                  <Text style={styles.resultTitle}>{report.title}</Text>
                  <Text style={styles.resultMeta}>
                    {report.supports_count || 0} apoios • {formatDate(report.updated_at)}
                  </Text>
                </View>
                {selectedReport?.id === report.id && (
                  <View style={styles.checkmark} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.buttonRow}>
            <Button
              title="Cancelar"
              onPress={onClose}
              variant="outline"
              style={styles.button}
            />
            <Button
              title="Relacionar"
              onPress={handleConfirm}
              disabled={!selectedReport}
              variant="primary"
              style={styles.button}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

ReportRelationModal.displayName = 'ReportRelationModal';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 32,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  typeOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#1976D2',
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  typeOptionTextSelected: {
    color: '#1976D2',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  resultsList: {
    gap: 8,
  },
  resultItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultItemSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#1976D2',
  },
  resultInfo: {
    flex: 1,
  },
  resultCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  resultMeta: {
    fontSize: 12,
    color: '#999',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
  },
});