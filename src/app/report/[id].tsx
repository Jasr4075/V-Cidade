import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Platform,
  Linking,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useResponsive } from "@/hooks/useResponsive";
import {
  useReport,
  useReportUpdates,
  useReportRelations,
  useResolutionConfirmation,
  useAnonymousId,
  useSupportReport,
} from "@/hooks/useReports";
import { searchReports } from "@/services/reports/reports";
import { ReportStatusBadge } from "@/components/ReportStatus";
import { Timeline } from "@/components/Timeline";
import { SupportButton } from "@/components/SupportButton";
import { Button } from "@/components/Button";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { ReportRelationModal } from "@/components/ReportRelationModal";
import { formatRelativeTime, formatDate } from "@/utils";
import {
  UPDATE_STATUS_LABELS,
  RELATION_TYPE_LABELS,
  MAX_UPDATE_DESCRIPTION_LENGTH,
} from "@/constants";
import {
  MaterialCommunityIcons,
  ICONS,
  UPDATE_STATUS_ICONS,
  getCategoryIcon,
  type IconName,
  colors,
  radii,
  spacing,
  fontSize,
  fontWeight,
  lineHeight,
  layout,
  HIT_SIZE,
} from "@/theme";
import type { RelationType, UpdateStatus } from "@/types";

const UPDATE_STATUSES: UpdateStatus[] = ["SAME", "WORSE", "BETTER", "RESOLVED"];

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { anonymousId, loading: anonLoading } = useAnonymousId();
  const {
    report,
    loading: reportLoading,
    error: reportError,
    refresh: refreshReport,
  } = useReport(id!, anonymousId);
  const {
    updates,
    loading: updatesLoading,
    addUpdate,
    refresh: refreshUpdates,
  } = useReportUpdates(id!);
  const {
    relations,
    addRelation,
    refresh: refreshRelations,
  } = useReportRelations(id!);
  const {
    confirmed,
    count,
    resolved,
    loading: confirmLoading,
    confirm,
    refresh: refreshConfirm,
  } = useResolutionConfirmation(id!, anonymousId);
  const {
    supported,
    supportsCount,
    loading: supportLoading,
    toggleSupport,
  } = useSupportReport(id!, anonymousId);

  // ── Debug ──────────────────────────────────────────────────────────────
  // Logs temporales para inspeccionar el estado de esta ruta /report/[id].
  console.log("[report] screen mount", {
    id,
    anonymousId,
    reportLoading,
    reportError,
    report: report
      ? {
          id: report.id,
          title: report.title,
          status: report.status,
          category: report.category?.label,
          supports_count: report.supports_count,
        }
      : null,
    updatesCount: updates?.length,
    relationsCount: relations?.length,
    resolved,
    confirmed,
    supportsCount,
  });
  // ── /Debug ─────────────────────────────────────────────────────────────

  const [showRelationModal, setShowRelationModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showInappropriateDialog, setShowInappropriateDialog] = useState(false);
  const [selectedUpdateStatus, setSelectedUpdateStatus] =
    useState<UpdateStatus>("SAME");
  const [updateDescription, setUpdateDescription] = useState("");
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  const responsive = useResponsive();
  const pad = responsive.gutter;
  const splitView = responsive.isLarge;
  const isLargeSheet = responsive.isLarge;

  const scrollContentStyle = {
    paddingHorizontal: pad,
    paddingTop: spacing.lg,
    paddingBottom: responsive.bottomInset + spacing.xxl,
    alignSelf: "center" as const,
    width: "100%" as const,
    maxWidth: responsive.maxContentWidth,
  };
  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }, []);

  const handleSupport = useCallback(async () => {
    const newSupported = await toggleSupport(supportsCount);
    if (newSupported !== supported) {
      refreshReport();
      refreshConfirm();
    }
  }, [toggleSupport, supportsCount, supported, refreshReport, refreshConfirm]);

  const handleConfirmResolution = useCallback(async () => {
    const success = await confirm();
    setShowConfirmDialog(false);
    if (success) {
      refreshReport();
      refreshConfirm();
      refreshUpdates();
    }
  }, [confirm, refreshReport, refreshConfirm, refreshUpdates]);

  const handleSubmitUpdate = useCallback(async () => {
    setSubmittingUpdate(true);
    const created = await addUpdate(
      selectedUpdateStatus,
      updateDescription.trim() || UPDATE_STATUS_LABELS[selectedUpdateStatus],
      anonymousId,
    );
    setSubmittingUpdate(false);

    if (created) {
      setShowUpdateModal(false);
      setUpdateDescription("");
      setSelectedUpdateStatus("SAME");
      refreshReport();
      refreshConfirm();
    }
  }, [
    addUpdate,
    selectedUpdateStatus,
    updateDescription,
    anonymousId,
    refreshReport,
    refreshConfirm,
  ]);

  const handleInappropriate = useCallback(() => {
    setShowInappropriateDialog(false);
    // Moderação ainda não implementada: a confirmação deixa o caminho pronto.
  }, []);

  const handleOpenInMaps = useCallback(() => {
    if (!report?.location) return;
    const [longitude, latitude] = report.location.coordinates;
    const url =
      Platform.OS === "ios"
        ? `maps://?q=${latitude},${longitude}`
        : `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => undefined);
  }, [report]);

  const handleRelate = useCallback(
    async (relatedReportId: string, type: RelationType) => {
      const relation = await addRelation(relatedReportId, type, anonymousId);
      if (relation) refreshRelations();
    },
    [addRelation, anonymousId, refreshRelations],
  );

  if (anonLoading || reportLoading) {
    return <LoadingState message="Carregando problema..." />;
  }

  if (reportError || !report) {
    return (
      <View style={styles.screen}>
        <TopBar onBack={handleBack} />
        <ErrorState
          message={reportError || "Problema não encontrado"}
          onRetry={refreshReport}
        />
      </View>
    );
  }

  const supports = report.supports_count || 0;
  const categoryLabel = report.category?.label || report.category_id;
  const coordinates = report.location
    ? `${report.location.coordinates[1].toFixed(6)}, ${report.location.coordinates[0].toFixed(6)}`
    : "Localização indisponível";

  const MainContent = () => (
    <>
      <View style={styles.section}>
        <View style={styles.headlineRow}>
          <View style={styles.categoryIcon}>
            <MaterialCommunityIcons
              name={getCategoryIcon(report.category?.slug)}
              size={20}
              color={colors.primary}
            />
          </View>
          <Text style={styles.categoryName} numberOfLines={1}>
            {categoryLabel}
          </Text>
        </View>

        <Text style={styles.title} accessibilityRole="header">
          {report.title}
        </Text>

        <ReportStatusBadge
          status={report.status}
          size="large"
          confirmationsCount={count}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.locationCard}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={18}
            color={colors.textMuted}
          />
          <Text style={styles.locationText} numberOfLines={2}>
            {coordinates}
          </Text>
          {report.location ? (
            <Pressable
              onPress={handleOpenInMaps}
              accessibilityRole="button"
              accessibilityLabel="Abrir no aplicativo de mapas"
              hitSlop={8}
              style={({ pressed }: { pressed: boolean }) => [
                styles.mapsButton,
                pressed && styles.mapsButtonPressed,
              ]}
            >
              <MaterialCommunityIcons
                name={ICONS.openInMaps}
                size={16}
                color={colors.primary}
              />
              <Text style={styles.mapsButtonText}>Mapa</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.stats}>
          <Stat
            icon={ICONS.thumbUp}
            value={String(supports)}
            label={supports === 1 ? "apoio" : "apoios"}
          />
          <View style={styles.statsDivider} />
          <Stat
            icon={ICONS.history}
            value={String(updates.length)}
            label={updates.length === 1 ? "atualização" : "atualizações"}
          />
          <View style={styles.statsDivider} />
          <Stat
            icon={ICONS.clock}
            value={formatRelativeTime(report.updated_at)}
            label="atualizado"
          />
        </View>
      </View>

      {resolved ? (
        <View style={styles.section}>
          <View
            style={styles.resolvedBanner}
            accessibilityRole="text"
            accessibilityLabel={`Problema resolvido, confirmado por ${count} ${
              count === 1 ? "pessoa" : "pessoas"
            }`}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={24}
              color={colors.onSuccessSoft}
            />
            <View style={styles.resolvedText}>
              <Text style={styles.resolvedTitle}>Problema resolvido</Text>
              <Text style={styles.resolvedBody}>
                Confirmado por {count} {count === 1 ? "pessoa" : "pessoas"}.
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <SupportButton
          supported={supported}
          count={supports}
          loading={supportLoading}
          onPress={handleSupport}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acompanhar</Text>
        <View style={styles.actions}>
          <Button
            title={confirmed ? "Resolução confirmada" : "Confirmar resolução"}
            onPress={() => setShowConfirmDialog(true)}
            variant={confirmed ? "secondary" : "primary"}
            disabled={confirmed || resolved || confirmLoading}
            icon={confirmed ? ICONS.check : undefined}
            accessibilityHint="Confirma que o problema foi resolvido"
            fullWidth
          />
          <Button
            title="Atualizar situação"
            onPress={() => setShowUpdateModal(true)}
            variant="outline"
            icon={ICONS.edit}
            accessibilityHint="Informa se o problema melhorou, piorou ou foi resolvido"
            fullWidth
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Outros problemas</Text>
        <View style={styles.actions}>
          <Button
            title="Relacionar registro"
            onPress={() => setShowRelationModal(true)}
            variant="outline"
            icon={ICONS.link}
            fullWidth
          />
          <Button
            title="Denunciar conteúdo"
            onPress={() => setShowInappropriateDialog(true)}
            variant="ghost"
            icon={ICONS.flag}
            fullWidth
          />
        </View>
      </View>
    </>
  );

  const AsideContent = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Histórico</Text>
        {updatesLoading ? (
          <Text style={styles.helper}>Carregando histórico...</Text>
        ) : (
          <Timeline
            updates={updates}
            initialReport={{
              title: report.title,
              created_at: report.created_at,
            }}
          />
        )}
      </View>

      {relations.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registros relacionados</Text>
          <View style={styles.relations}>
            {relations.map((relation) => (
              <Pressable
                key={relation.id}
                onPress={() =>
                  relation.related_report?.id &&
                  router.push(`/report/${relation.related_report.id}`)
                }
                disabled={!relation.related_report?.id}
                accessibilityRole="button"
                accessibilityLabel={`${RELATION_TYPE_LABELS[relation.relation_type]}: ${
                  relation.related_report?.title || "registro"
                }`}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.relation,
                  pressed && styles.relationPressed,
                ]}
              >
                <View style={styles.relationType}>
                  <Text style={styles.relationTypeText}>
                    {RELATION_TYPE_LABELS[relation.relation_type]}
                  </Text>
                </View>
                <View style={styles.relationInfo}>
                  <Text style={styles.relationTitle} numberOfLines={1}>
                    {relation.related_report?.title || "Registro"}
                  </Text>
                  <Text style={styles.relationMeta}>
                    {relation.related_report?.category?.label} ·{" "}
                    {relation.related_report?.supports_count || 0} apoios
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={ICONS.chevronRight}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </>
  );

  return (
    <View style={styles.screen}>
      <TopBar onBack={handleBack} />

      <ScrollView
        contentContainerStyle={scrollContentStyle}
      >
        {splitView ? (
          <View style={styles.splitRow}>
            <View style={styles.splitMain}>{MainContent()}</View>
            <View style={styles.splitAside}>{AsideContent()}</View>
          </View>
        ) : (
          <>
            {MainContent()}
            {AsideContent()}
          </>
        )}

        <Text style={styles.footnote}>
          Registrado em {formatDate(report.created_at)} · identificação anônima
        </Text>
      </ScrollView>

      <ConfirmationModal
        visible={showConfirmDialog}
        title="Confirmar resolução?"
        message={
          confirmed
            ? "Você já confirmou que este problema foi resolvido."
            : "Sua confirmação ajuda a equipe a priorizar o que ainda não foi resolvido."
        }
        confirmLabel="Confirmar"
        confirmLoading={confirmLoading}
        onConfirm={handleConfirmResolution}
        onCancel={() => setShowConfirmDialog(false)}
      />

      <ConfirmationModal
        visible={showInappropriateDialog}
        title="Denunciar conteúdo?"
        message="Este problema não corresponde à realidade ou contém informação pessoal?"
        confirmLabel="Denunciar"
        variant="danger"
        icon={ICONS.flag}
        onConfirm={handleInappropriate}
        onCancel={() => setShowInappropriateDialog(false)}
      />

      <ReportRelationModal
        visible={showRelationModal}
        currentReport={report}
        onClose={() => setShowRelationModal(false)}
        onRelate={handleRelate}
        searchReports={searchReports}
      />

      <Modal
        visible={showUpdateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View
          style={[styles.sheetRoot, isLargeSheet && styles.sheetRootCentered]}
        >
          <Pressable
            style={styles.sheetScrim}
            onPress={() => setShowUpdateModal(false)}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          />

          <View style={[styles.sheet, isLargeSheet && styles.sheetCentered]}>
            {/* A alça de arrasto não significa nada num diálogo centralizado. */}
            <View
              style={isLargeSheet ? styles.grabberHidden : styles.grabber}
            />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle} accessibilityRole="header">
                  Atualizar situação
                </Text>
                <Text style={styles.sheetSubtitle}>
                  Como está o problema agora?
                </Text>
              </View>
              <Pressable
                onPress={() => setShowUpdateModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                hitSlop={8}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.sheetClose,
                  pressed && styles.sheetClosePressed,
                ]}
              >
                <MaterialCommunityIcons
                  name={ICONS.close}
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            <ScrollView
              style={styles.sheetBody}
              contentContainerStyle={styles.sheetBodyContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.statusOptions}>
                {UPDATE_STATUSES.map((status) => {
                  const active = selectedUpdateStatus === status;
                  return (
                    <Pressable
                      key={status}
                      onPress={() => setSelectedUpdateStatus(status)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={UPDATE_STATUS_LABELS[status]}
                      style={({ pressed }: { pressed: boolean }) => [
                        styles.statusOption,
                        active && styles.statusOptionSelected,
                        pressed && !active && styles.statusOptionPressed,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={UPDATE_STATUS_ICONS[status]}
                        size={20}
                        color={active ? colors.onPrimary : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.statusOptionText,
                          active && styles.statusOptionTextSelected,
                        ]}
                      >
                        {UPDATE_STATUS_LABELS[status]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.updateField}>
                <Text
                  style={styles.updateLabel}
                  nativeID="update-description-label"
                >
                  Detalhes <Text style={styles.optional}>opcional</Text>
                </Text>
                <TextInput
                  style={styles.updateInput}
                  multiline
                  textAlignVertical="top"
                  placeholder="Ex: A equipe da prefeitura passou hoje e began o reparo."
                  placeholderTextColor={colors.textDisabled}
                  value={updateDescription}
                  onChangeText={setUpdateDescription}
                  maxLength={MAX_UPDATE_DESCRIPTION_LENGTH}
                  accessibilityLabel="Detalhes da atualização"
                  accessibilityLabelledBy="update-description-label"
                />
                <Text style={styles.updateCounter}>
                  {updateDescription.length}/{MAX_UPDATE_DESCRIPTION_LENGTH}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.sheetFooter}>
              <Button
                title="Cancelar"
                onPress={() => setShowUpdateModal(false)}
                variant="outline"
                style={styles.sheetButton}
              />
              <Button
                title="Enviar atualização"
                onPress={handleSubmitUpdate}
                loading={submittingUpdate}
                style={styles.sheetButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TopBar({ onBack }: { onBack: () => void }) {
  const responsive = useResponsive();

  return (
    <View style={[styles.topBar, { paddingTop: responsive.topInset + spacing.sm }]}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        style={({ pressed }: { pressed: boolean }) => [
          styles.backButton,
          pressed && styles.backButtonPressed,
        ]}
      >
        <MaterialCommunityIcons
          name={ICONS.back}
          size={24}
          color={colors.text}
        />
      </Pressable>
    </View>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: IconName;
  value: string;
  label: string;
}) {
  return (
    <View
      style={styles.stat}
      accessible
      accessibilityLabel={`${value} ${label}`}
    >
      <MaterialCommunityIcons name={icon} size={18} color={colors.textMuted} />
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    width: "100%",
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  backButton: {
    width: HIT_SIZE,
    height: HIT_SIZE,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonPressed: {
    backgroundColor: colors.surfaceSunken,
  },

  // Duas colunas a partir de tablet: a principal com o problema e as ações,
  // a lateral com histórico e registros relacionados. `flex` em vez de
  // largura fixa para as duas acompanharem o tier sem números mágicos.
  splitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },
  splitMain: {
    flex: 2,
    minWidth: 0,
  },
  splitAside: {
    flex: 1,
    minWidth: 0,
  },
  section: {
    gap: spacing.sm,
    paddingTop: spacing.base,
  },
  sectionTitle: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  helper: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },

  headlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  categoryName: {
    flex: 1,
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  title: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.text,
    lineHeight: fontSize.display * lineHeight.tight,
    marginTop: spacing.xs,
  },

  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationText: {
    flex: 1,
    fontSize: fontSize.small,
    color: colors.textSecondary,
    lineHeight: fontSize.small * lineHeight.snug,
  },
  mapsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    // `HIT_SIZE` (48px) e não 36: era o único alvo de toque da tela abaixo do
    // mínimo, e ficava especialmente ruim em Landscape no celular.
    minHeight: HIT_SIZE,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  mapsButtonPressed: {
    backgroundColor: colors.primaryBorder,
  },
  mapsButtonText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },

  stats: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingHorizontal: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  statsDivider: {
    width: 1,
    marginVertical: spacing.xs,
    backgroundColor: colors.divider,
  },

  resolvedBanner: {
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radii.md,
    backgroundColor: colors.successSoft,
    borderColor: colors.successBorder,
  },
  resolvedText: {
    flex: 1,
  },
  resolvedTitle: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.onSuccessSoft,
  },
  resolvedBody: {
    fontSize: fontSize.small,
    color: colors.onSuccessSoft,
  },

  actions: {
    gap: spacing.sm,
  },

  relations: {
    gap: spacing.sm,
  },
  relation: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  relationPressed: {
    backgroundColor: colors.surfaceSunken,
  },
  relationType: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  relationTypeText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  relationInfo: {
    flex: 1,
    gap: 2,
  },
  relationTitle: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  relationMeta: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },

  footnote: {
    paddingTop: spacing.xl,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    textAlign: "center",
  },

  sheetRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  // A partir de tablet a folha vira diálogo centralizado: ancorada embaixo e
  // com 720px de largura, ela virava uma faixa enorme e Desproporcional.
  sheetRootCentered: {
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  sheetScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  sheet: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    paddingBottom: spacing.xl,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    backgroundColor: colors.surface,
  },
  sheetCentered: {
    maxWidth: layout.dialogMaxWidth,
    borderRadius: radii.xl,
    // `maxHeight` + flex garante que o conteúdo rolável caiba na tela em vez de
    // a folha passar da borda inferior em notebooks de baixa altura.
    maxHeight: "90%",
    paddingBottom: 0,
  },
  grabberHidden: {
    height: 0,
  },
  // O corpo da folha rola sozinho: em Landscape no celular ou num notebook
  // baixo, status + campo + botões não cabem e o rodado sumia da vista.
  sheetBody: {
    flexGrow: 0,
  },
  sheetBodyContent: {
    paddingBottom: spacing.base,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: spacing.sm,
    backgroundColor: colors.borderStrong,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
  },
  sheetHeaderText: {
    flex: 1,
    gap: 2,
  },
  sheetTitle: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  sheetSubtitle: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  sheetClose: {
    // `HIT_SIZE` (48px) em vez de 40px — fecha era o alvo mais apertado da tela.
    width: HIT_SIZE,
    height: HIT_SIZE,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSunken,
  },
  sheetClosePressed: {
    backgroundColor: colors.borderStrong,
  },

  statusOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: HIT_SIZE,
    paddingHorizontal: spacing.base,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statusOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusOptionPressed: {
    backgroundColor: colors.surfaceSunken,
  },
  statusOptionText: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  statusOptionTextSelected: {
    color: colors.onPrimary,
  },

  updateField: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    gap: spacing.sm,
  },
  updateLabel: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  optional: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.regular,
    color: colors.textMuted,
  },
  updateInput: {
    minHeight: 96,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    fontSize: fontSize.body,
    color: colors.text,
    lineHeight: fontSize.body * lineHeight.normal,
  },
  updateCounter: {
    alignSelf: "flex-end",
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },

  sheetFooter: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sheetButton: {
    flex: 1,
  },
});
