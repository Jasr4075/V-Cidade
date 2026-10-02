import React from 'react';
import { ViewStyle } from 'react-native';
import { StateView } from './StateView';

interface LoadingStateProps {
  message?: string;
  compact?: boolean;
  style?: ViewStyle;
}

export const LoadingState = ({
  message = 'Carregando...',
  compact = false,
  style,
}: LoadingStateProps) => (
  <StateView
    variant="loading"
    message={message}
    compact={compact}
    style={style}
  />
);

LoadingState.displayName = 'LoadingState';