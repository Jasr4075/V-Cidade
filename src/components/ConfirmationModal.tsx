import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Modal, ScrollView, Platform } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';
import { MaterialCommunityIcons, ICONS, type IconName, colors, palette, radii, shadow, spacing, fontSize, fontWeight, HIT_SIZE } from '@/theme';
import { Button } from './Button';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger';
  icon?: IconName;
  confirmLoading?: boolean;
}

/**
 * Diálogo de confirmação.
 *
 * Um único container `flex: 1` contém scrim e conteúdo, então o fundo cobre a
 * tela inteira. Antes, scrim e diálogo eram irmãos com `flex: 1` cada, e o
 * modal ficava espremido no topo.
 */
export const ConfirmationModal = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'default',
  icon,
  confirmLoading = false,
}: ConfirmationModalProps) => {
  // Hook antes do `return null`: um hook condicional quebraria a ordem de
  // hooks quando o modal abre e fecha.
  const responsive = useResponsive();

  if (!visible) return null;

  const danger = variant === 'danger';
  const iconColor = danger ? colors.danger : colors.primary;
  const iconBackground = danger ? colors.dangerSoft : colors.primarySoft;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.root}>
        <Pressable
          style={styles.scrim}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        />

        <View style={styles.center} pointerEvents="box-none">
          <View
            style={[styles.dialog, { maxWidth: responsive.dialogWidth }]}
            accessibilityViewIsModal
            accessibilityRole="alert"
          >
            <View style={[styles.icon, { backgroundColor: iconBackground }]}>
              <MaterialCommunityIcons
                name={icon ?? (danger ? ICONS.alertTriangle : ICONS.help)}
                size={24}
                color={iconColor}
              />
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
              <Text style={styles.title} accessibilityRole="header">
                {title}
              </Text>
              <Text style={styles.message}>{message}</Text>

              {confirmLoading ? (
                <View style={styles.loading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Processando...</Text>
                </View>
              ) : null}
            </ScrollView>

            {/* Empilhados no celular: lado a lado sobrariam ~100px por botão e
                rótulos como "Confirmar resolução" seriam cortados. */}
            <View style={responsive.isMobile ? styles.actionsStacked : styles.actionsRow}>
              <Button
                title={cancelLabel}
                onPress={onCancel}
                variant="outline"
                style={styles.action}
              />
              <Button
                title={confirmLabel}
                onPress={onConfirm}
                variant={danger ? 'danger' : 'primary'}
                loading={confirmLoading}
                style={styles.action}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

ConfirmationModal.displayName = 'ConfirmationModal';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
        ...Platform.select({
      web: { boxShadow: "0 10px 30px rgba(0,0,0,0.25)" },
      default: shadow.lg as object,
    }),
  },
  body: {
    maxHeight: '60%',
  },
  bodyContent: {
    gap: spacing.sm,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  message: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    lineHeight: fontSize.body * 1.5,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  actionsStacked: {
    flexDirection: 'column',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  action: {
    flex: 1,
    minHeight: HIT_SIZE,
  },
});