import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = React.forwardRef<TouchableOpacity, ButtonProps>(
  (
    {
      title,
      onPress,
      variant = 'primary',
      size = 'medium',
      disabled = false,
      loading = false,
      fullWidth = false,
      style,
      textStyle,
    },
    ref
  ) => {
    const baseStyles = styles.base;
    const variantStyles = styles[variant];
    const sizeStyles = styles[size];
    const widthStyle = fullWidth ? styles.fullWidth : {};

    return (
      <TouchableOpacity
        ref={ref}
        style={[
          baseStyles,
          variantStyles,
          sizeStyles,
          widthStyle,
          style,
          (disabled || loading) && styles.disabled,
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? '#fff' : '#1976D2'} size="small" />
        ) : (
          <Text style={[styles.text, variantStyles.text, sizeStyles.text, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: '#1976D2',
  },
  secondary: {
    backgroundColor: '#E3F2FD',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1976D2',
  },
  danger: {
    backgroundColor: '#E53935',
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  medium: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  large: {
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontWeight: '600',
    fontSize: 16,
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#1976D2',
  },
  outlineText: {
    color: '#1976D2',
  },
  dangerText: {
    color: '#fff',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
});