import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: object;
}

export const EmptyState = ({
  icon = '📍',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <Text style={styles.action} onPress={onAction}>
          {actionLabel}
        </Text>
      )}
    </View>
  );
};

EmptyState.displayName = 'EmptyState';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  action: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    textDecorationLine: 'underline',
  },
});