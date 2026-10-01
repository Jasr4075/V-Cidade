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

const variantStyles: Record<string, ViewStyle & { textColor: string }> = {
  primary: { backgroundColor: '#1976D2', textColor: '#fff' },
  secondary: { backgroundColor: '#E3F2FD', textColor: '#1976D2' },
  outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#1976D2', textColor: '#1976D2' },
  danger: { backgroundColor: '#E53935', textColor: '#fff' },
};

const sizeStyles: Record<string, ViewStyle & { fontSize: number }> = {
  small: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
  medium: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 16 },
  large: { paddingVertical: 18, paddingHorizontal: 32, fontSize: 18 },
};

export const Button = React.forwardRef<any, ButtonProps>(
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
    const vStyles = variantStyles[variant];
    const sStyles = sizeStyles[size];
    const widthStyle = fullWidth ? styles.fullWidth : {};

    return (
      <TouchableOpacity
        ref={ref}
        style={[
          styles.base,
          vStyles,
          sStyles,
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
          <Text style={[styles.text, { color: (vStyles as any).textColor }, { fontSize: (sStyles as any).fontSize }, textStyle]}>{title}</Text>
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
});