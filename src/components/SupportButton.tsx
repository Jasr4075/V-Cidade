import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { MaterialCommunityIcons, ICONS, colors, radii, spacing, fontSize, fontWeight, HIT_SIZE } from '@/theme';
interface SupportButtonProps {
  supported: boolean;
  count: number;
  loading: boolean;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Ação de apoio. É a interação mais repetida do app, então o estado apoiado
 * muda cor, ícone e texto — nunca só a cor.
 */
export const SupportButton = ({
  supported,
  count,
  loading,
  onPress,
  disabled = false,
}: SupportButtonProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: supported ? 1 : 0.92,
      useNativeDriver: true,
    }).start();
  }, [supported, scale]);

  const supportsLabel =
    count === 0 ? 'Ninguém apoia ainda' : count === 1 ? '1 apoio' : `${count} apoios`;

  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      accessibilityRole="button"
      accessibilityLabel={
        supported ? `Você apoia este problema. ${supportsLabel}` : `Apoiar este problema. ${supportsLabel}`
      }
      accessibilityHint={
        supported ? 'Toque para remover seu apoio' : 'Toque para mostrar que o problema te afeta'
      }
      accessibilityState={{ selected: supported, disabled: loading || disabled, busy: loading }}
      style={({ pressed }: { pressed: boolean }) => [
        styles.container,
        supported && styles.containerSupported,
        pressed && !loading && !disabled && styles.containerPressed,
        (loading || disabled) && styles.containerDisabled,
      ]}
    >
      <Animated.View style={[styles.iconWrap, supported && styles.iconWrapSupported, { transform: [{ scale }] }]}>
        <MaterialCommunityIcons
          name={supported ? ICONS.thumbUpFilled : ICONS.thumbUp}
          size={22}
          color={supported ? colors.onSuccessSoft : colors.primary}
        />
      </Animated.View>

      <View style={styles.text}>
        <Text style={[styles.count, supported && styles.countSupported]}>{supportsLabel}</Text>
        <Text style={[styles.label, supported && styles.labelSupported]}>
          {supported ? 'Você apoia este problema' : 'Apoiar este problema'}
        </Text>
      </View>

      <MaterialCommunityIcons
        name={supported ? ICONS.check : ICONS.plus}
        size={20}
        color={supported ? colors.onSuccessSoft : colors.textMuted}
      />
    </Pressable>
  );
};

SupportButton.displayName = 'SupportButton';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: HIT_SIZE + 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  containerSupported: {
    borderColor: colors.successBorder,
    backgroundColor: colors.successSoft,
  },
  containerPressed: {
    backgroundColor: colors.surfaceSunken,
  },
  containerDisabled: {
    opacity: 0.6,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  iconWrapSupported: {
    backgroundColor: colors.surface,
  },
  text: {
    flex: 1,
    gap: 1,
  },
  count: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  countSupported: {
    color: colors.onSuccessSoft,
  },
  label: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  labelSupported: {
    color: colors.onSuccessSoft,
    fontWeight: fontWeight.medium,
  },
});