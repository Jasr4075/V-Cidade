import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ReportStatus } from '@/types';
import { getStatusColor, STATUS_LABELS } from '@/utils';

interface ReportStatusProps {
  status: ReportStatus;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  confirmationsCount?: number;
}

export const ReportStatus = ({ status, size = 'medium', showLabel = true, confirmationsCount }: ReportStatusProps) => {
  const color = getStatusColor(status);
  const label = STATUS_LABELS[status] || status;

  const sizeStyles = {
    small: { paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, borderRadius: 8 },
    medium: { paddingHorizontal: 12, paddingVertical: 5, fontSize: 12, borderRadius: 10 },
    large: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14, borderRadius: 12 },
  };

  const style = sizeStyles[size];

  return (
    <View style={[styles.container, { backgroundColor: color }]}>
      <Text style={[styles.text, style, { color: '#fff' }]}>
        {label}
      </Text>
      {confirmationsCount && confirmationsCount > 0 && showLabel && (
        <Text style={[styles.confirmations, style]}>
          {confirmationsCount} confirmação{confirmationsCount > 1 ? 'ões' : ''}
        </Text>
      )}
    </View>
  );
};

ReportStatus.displayName = 'ReportStatus';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontWeight: '700',
  },
  confirmations: {
    fontWeight: '500',
    opacity: 0.9,
  },
});