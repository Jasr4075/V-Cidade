import React from 'react';
import { ViewStyle } from 'react-native';
import { StateView } from './StateView';
import { type IconName } from '@/theme/icons';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  icon?: IconName;
  compact?: boolean;
  style?: ViewStyle;
}

export const ErrorState = ({
  title = 'Não foi possível carregar',
  message,
  onRetry,
  retryLabel = 'Tentar novamente',
  secondaryActionLabel,
  onSecondaryAction,
  icon,
  compact = false,
  style,
}: ErrorStateProps) => (
  <StateView
    variant="error"
    icon={icon}
    title={title}
    message={message}
    actionLabel={onRetry ? retryLabel : undefined}
    onAction={onRetry}
    secondaryActionLabel={secondaryActionLabel}
    onSecondaryAction={onSecondaryAction}
    compact={compact}
    style={style}
  />
);

ErrorState.displayName = 'ErrorState';