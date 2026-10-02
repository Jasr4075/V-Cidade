import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  useWindowDimensions,
 Modal } from 'react-native';
import { Button } from './Button';
import { Report, RelationType } from '@/types';
import { RELATION_TYPE_LABELS } from '@/constants';
import { MaterialCommunityIcons, ICONS, getCategoryIcon, colors, palette, radii, shadow, spacing, fontSize, fontWeight, lineHeight, layout, HIT_SIZE } from '@/theme';
interface ReportRelationModalProps {
  visible: boolean;
  currentReport: Report;
  onClose: () => void;
  onRelate: (relatedReportId: string, type: RelationType) => void;
  searchReports: (query: string) => Promise<Report[]>;
}

const RELATION_TYPES: RelationType[] = ['DUPLICATE', 'RELATED', 'CONTINUATION'];

/**
 * Sheet para relacionar dois registros.
 *
 * O estado selecionado sempre fica visível no rodapé: sem isso, rolar a lista
 * fazia o usuário esquecer o que tinha escolhido.
 */
export const ReportRelationModal = ({
  visible,
  currentReport,
  onClose,
  onRelate,
  searchReports,
}: ReportRelationModalProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Report[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedType, setSelectedType] = useState<RelationType>('DUPLICATE');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { height } = useWindowDimensions();
  const compact = height < 700;

  const handleSearch = useCallback(
    async (text: string) => {
      setQuery(text);
      setSelectedReport(null);

      if (text.trim().length < 2) {
        setResults([]);
        setSearched(false);
        return;
      }

      setSearching(true);
      try {
        const data = await searchReports(text);
        setResults(data.filter((r) => r.id !== currentReport.id));
        setSearched(true);
      } catch {
        setResults([]);
        setSearched(true);
      } finally {
        setSearching(false);
      }
    },
    [currentReport.id, searchReports]
  );

  const handleClose = useCallback(() => {
    setQuery('');
    setResults([]);
    setSelectedReport(null);
    setSearched(false);
    onClose();
  }, [onClose]);

  const handleConfirm = useCallback(async () => {
    if (!selectedReport) return;
    setSubmitting(true);
    onRelate(selectedReport.id, selectedType);
    setSubmitting(false);
    handleClose();
  }, [selectedReport, selectedType, onRelate, handleClose]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.scrim}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        />

        <View style={[styles.sheet, compact && styles.sheetCompact]}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title} accessibilityRole="header">
                Relacionar problema
              </Text>
              <Text style={styles.subtitle}>
                Selecione como este registro se conecta com outro
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={8}
              style={({ pressed }: { pressed: boolean }) => [
                styles.close,
                pressed && styles.closePressed,
              ]}
            >
              <MaterialCommunityIcons name={ICONS.close} size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label} nativeID="relation-type-label">
              Tipo de relação
            </Text>
            <View style={styles.typeRow} accessibilityLabelledBy="relation-type-label">
              {RELATION_TYPES.map((type) => {
                const active = selectedType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setSelectedType(type)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={RELATION_TYPE_LABELS[type]}
                    style={({ pressed }: { pressed: boolean }) => [
                      styles.typeChip,
                      active && styles.typeChipSelected,
                      pressed && !active && styles.typeChipPressed,
                    ]}
                  >
                    {active ? (
                      <MaterialCommunityIcons
                        name={ICONS.check}
                        size={14}
                        color={colors.onPrimary}
                        style={styles.typeChipIcon}
                      />
                    ) : null}
                    <Text style={[styles.typeChipText, active && styles.typeChipTextSelected]}>
                      {RELATION_TYPE_LABELS[type]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label} nativeID="relation-search-label">
              Buscar problema
            </Text>
            <View style={styles.searchBox}>
              <MaterialCommunityIcons
                name={ICONS.search}
                size={20}
                color={colors.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Título do problema"
                placeholderTextColor={colors.textDisabled}
                value={query}
                onChangeText={handleSearch}
                accessibilityLabel="Buscar problema para relacionar"
                accessibilityLabelledBy="relation-search-label"
                returnKeyType="search"
                autoCorrect={false}
              />
              {searching ? (
                <MaterialCommunityIcons name="cloud-sync-outline" size={18} color={colors.textMuted} />
              ) : query.length > 0 ? (
                <Pressable
                  onPress={() => handleSearch('')}
                  accessibilityRole="button"
                  accessibilityLabel="Limpar busca"
                  hitSlop={8}
                >
                  <MaterialCommunityIcons name={ICONS.close} size={18} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.helper}>Digite ao menos 2 caracteres.</Text>
          </View>

          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {searching
                ? 'Buscando...'
                : results.length > 0
                  ? `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}`
                  : searched
                    ? 'Nenhum resultado'
                    : 'Aguardando busca'}
            </Text>
            {selectedReport ? (
              <View style={styles.selectedTag}>
                <MaterialCommunityIcons name={ICONS.check} size={14} color={colors.success} />
                <Text style={styles.selectedTagText} numberOfLines={1}>
                  Selecionado
                </Text>
              </View>
            ) : null}
          </View>

          <ScrollView
            style={styles.results}
            contentContainerStyle={styles.resultsContent}
            keyboardShouldPersistTaps="handled"
          >
            {results.map((report) => {
              const active = selectedReport?.id === report.id;
              return (
                <Pressable
                  key={report.id}
                  onPress={() => setSelectedReport(report)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${report.title}, ${
                    report.supports_count || 0
                  } apoios, ${RELATION_TYPE_LABELS[selectedType]}`}
                  style={({ pressed }: { pressed: boolean }) => [
                    styles.result,
                    active && styles.resultSelected,
                    pressed && !active && styles.resultPressed,
                  ]}
                >
                  <View style={styles.resultIcon}>
                    <MaterialCommunityIcons
                      name={getCategoryIcon(report.category?.slug)}
                      size={18}
                      color={active ? colors.onPrimary : colors.textMuted}
                    />
                  </View>

                  <View style={styles.resultInfo}>
                    <Text style={styles.resultTitle} numberOfLines={1}>
                      {report.title}
                    </Text>
                    <Text style={styles.resultMeta} numberOfLines={1}>
                      {report.category?.label} · {report.supports_count || 0}{' '}
                      {report.supports_count === 1 ? 'apoio' : 'apoios'} ·{' '}
                      {formatShortDate(report.updated_at)}
                    </Text>
                  </View>

                  <View style={[styles.radio, active && styles.radioSelected]}>
                    {active ? (
                      <MaterialCommunityIcons name={ICONS.check} size={14} color={colors.onPrimary} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Cancelar"
              onPress={handleClose}
              variant="outline"
              style={styles.footerButton}
            />
            <Button
              title="Relacionar"
              onPress={handleConfirm}
              disabled={!selectedReport}
              loading={submitting}
              style={styles.footerButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

ReportRelationModal.displayName = 'ReportRelationModal';

function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'data desconhecida';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  sheet: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    maxHeight: '90%',
    paddingBottom: spacing.xl,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    backgroundColor: colors.surface,
    shadowColor: palette.gray900,
    ...(shadow.lg as object),
  },
  sheetCompact: {
    maxHeight: '94%',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: spacing.sm,
    backgroundColor: colors.borderStrong,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    lineHeight: fontSize.small * lineHeight.snug,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSunken,
  },
  closePressed: {
    backgroundColor: colors.borderStrong,
  },

  field: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  helper: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },

  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: HIT_SIZE,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipPressed: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  typeChipIcon: {
    marginRight: 2,
  },
  typeChipText: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  typeChipTextSelected: {
    color: colors.onPrimary,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: HIT_SIZE,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchIcon: {
    marginLeft: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },

  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  resultsTitle: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: 140,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  selectedTagText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    color: colors.onSuccessSoft,
  },

  results: {
    flexGrow: 0,
    maxHeight: 260,
  },
  resultsContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  resultSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  resultPressed: {
    backgroundColor: colors.surfaceSunken,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSunken,
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  resultMeta: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
  },
  footerButton: {
    flex: 1,
  },
});