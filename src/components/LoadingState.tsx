import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  style?: object;
}

export const LoadingState = ({ message = 'Carregando...', size = 'large', style }: LoadingStateProps) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color="#1976D2" />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

LoadingState.displayName = 'LoadingState';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});