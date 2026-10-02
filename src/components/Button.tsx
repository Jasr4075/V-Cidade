import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
  View,
} from 'react-native';
import { colors, radii, spacing, fontSize, fontWeight, HIT_SIZE } from '@/theme';
import { MaterialCommunityIcons, type IconName } from '@/theme/icons';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  /** Complementa o rótulo — nunca o substitui. */
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  accessibilityHint?: string;
}

interface VariantSpec {
  bg: string;
  fg: string;
  border: string;
  pressed: string;
}

const variants: Record<ButtonVariant, VariantSpec> = {
  primary: {
    bg: colors.primary,
    fg: colors.onPrimary,
    border: 'transparent',
    pressed: colors.primaryPressed,
  },
  secondary: {
    bg: colors.primarySoft,
    fg: colors.primary,
    border: colors.primaryBorder,
    pressed: colors.primaryBorder,
  },
  outline: {
    bg: colors.surface,
    fg: colors.primary,
    border: colors.primaryBorder,
    pressed: colors.primarySoft,
  },
  ghost: {
    bg: 'transparent',
    fg: colors.textSecondary,
    border: 'transparent',
    pressed: colors.surfaceSunken,
  },
  danger: {
    bg: colors.danger,
    fg: colors.textInverse,
    border: 'transparent',
    pressed: colors.danger,
  },
};

/** Alturas mantidas em 48px ou mais: alvos de toque adequados para mãos maiores. */
const sizes: Record<ButtonSize, { minHeight: number; paddingHorizontal: number; font: number; icon: number }> = {
  small: { minHeight: HIT_SIZE, paddingHorizontal: spacing.base, font: fontSize.small, icon: 18 },
  medium: { minHeight: HIT_SIZE, paddingHorizontal: spacing.lg, font: fontSize.body, icon: 20 },
  large: { minHeight: 56, paddingHorizontal: spacing.xl, font: fontSize.title, icon: 22 },
};

export const Button = React.forwardRef<View, ButtonProps>(
  (
    {
      title,
      onPress,
      variant = 'primary',
      size = 'medium',
      disabled = false,
      loading = false,
      fullWidth = false,
      icon,
      style,
      textStyle,
      accessibilityHint,
    },
    ref
  ) => {
    const v = variants[variant];
    const s = sizes[size];
    const inactive = disabled || loading;

    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: inactive, busy: loading }}
        disabled={inactive}
        style={({ pressed }: { pressed: boolean }) => [
          styles.base,
          {
            backgroundColor: pressed && !inactive ? v.pressed : v.bg,
            borderColor: v.border,
            minHeight: s.minHeight,
            paddingHorizontal: s.paddingHorizontal,
          },
          v.border !== 'transparent' && styles.bordered,
          fullWidth && styles.fullWidth,
          inactive && styles.inactive,
          style,
        ]}
        onPress={onPress}
      >
        {loading ? (
          <ActivityIndicator color={v.fg} size="small" />
        ) : (
          <View style={styles.content}>
            {icon ? (
              <MaterialCommunityIcons
                name={icon}
                size={s.icon}
                color={inactive ? colors.textDisabled : v.fg}
                style={styles.icon}
              />
            ) : null}
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                { color: inactive ? colors.textDisabled : v.fg, fontSize: s.font },
                textStyle,
              ]}
            >
              {title}
            </Text>
          </View>
        )}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  bordered: {
    borderWidth: 1.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  icon: {
    marginTop: -1,
  },
  label: {
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  inactive: {
    backgroundColor: colors.surfaceSunken,
    borderColor: colors.border,
  },
});