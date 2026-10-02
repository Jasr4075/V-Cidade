import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { colors, spacing, fontSize, fontWeight, lineHeight, layout } from '@/theme';
import { Button } from './Button';
import { MaterialCommunityIcons, type IconName } from '@/theme/icons';

interface StateViewProps {
  /** 'loading' mostra spinner; os demais mostram ícone + texto. */
  variant: 'loading' | 'empty' | 'error' | 'info';
  title?: string;
  message?: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  compact?: boolean;
  style?: ViewStyle;
}

/**
 * Primitivo único para os estados de tela.
 * Garante que carregando / vazio / erro / informação tenham a mesma
 * estrutura e o mesmo peso visual em todo o app.
 */
export const StateView = ({
  variant,
  title,
  message,
  icon,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
  style,
}: StateViewProps) => {
  const isLoading = variant === 'loading';
  const accent =
    variant === 'error' ? colors.danger : variant === 'info' ? colors.info : colors.textSecondary;

  const fallbackIcon: IconName =
    variant === 'error' ? 'alert-circle-outline' : variant === 'info' ? 'information-outline' : 'map-search-outline';

  return (
    <View style={[styles.container, compact && styles.compact, style]}>
      <View style={styles.iconWell}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <MaterialCommunityIcons name={icon ?? fallbackIcon} size={compact ? 26 : 34} color={accent} />
        )}
      </View>

      {title ? (
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      ) : null}

      {message ? <Text style={styles.message}>{message}</Text> : null}

      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} variant="primary" size="medium" style={styles.action} />
      ) : null}

      {secondaryActionLabel && onSecondaryAction ? (
        <Button
          title={secondaryActionLabel}
          onPress={onSecondaryAction}
          variant="ghost"
          size="medium"
          style={styles.action}
        />
      ) : null}
    </View>
  );
};

StateView.displayName = 'StateView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  compact: {
    paddingVertical: spacing.lg,
  },
  iconWell: {
    marginBottom: spacing.base,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: fontSize.body * lineHeight.normal,
    maxWidth: 380,
  },
  action: {
    marginTop: spacing.base,
    alignSelf: 'center',
  },
});