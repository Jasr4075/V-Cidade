import React from 'react';
import { ViewStyle } from 'react-native';
import { StateView } from './StateView';
import { type IconName } from '@/theme/icons';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  compact?: boolean;
  style?: ViewStyle;
}

export const EmptyState = ({
  icon = 'map-search-outline',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
  style,
}: EmptyStateProps) => (
  <StateView
    variant="empty"
    icon={icon}
    title={title}
    message={description}
    actionLabel={actionLabel}
    onAction={onAction}
    secondaryActionLabel={secondaryActionLabel}
    onSecondaryAction={onSecondaryAction}
    compact={compact}
    style={style}
  />
);

EmptyState.displayName = 'EmptyState';