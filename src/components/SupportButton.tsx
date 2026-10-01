import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

interface SupportButtonProps {
  supported: boolean;
  count: number;
  loading: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export const SupportButton = ({ supported, count, loading, onPress, disabled }: SupportButtonProps) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    scaleAnim.setValue(supported ? 1.1 : 1);
    Animated.spring(scaleAnim, {
      toValue: supported ? 1.1 : 1,
      useNativeDriver: true,
    }).start();
  }, [supported]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={supported ? `Apoiado por ${count} pessoas` : `Apoiar, ${count} apoios`}
      accessibilityState={{ selected: supported }}
    >
      <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={[
          styles.icon,
          supported && styles.iconSupported,
        ]}>
          {supported ? '✓' : '👍'}
        </Text>
      </Animated.View>
      <View style={styles.textContainer}>
        <Text style={[
          styles.countText,
          supported && styles.countTextSupported,
        ]}>
          {count} {count === 1 ? 'apoio' : 'apoios'}
        </Text>
        <Text style={[
          styles.labelText,
          supported && styles.labelTextSupported,
        ]}>
          {supported ? 'Você apoia' : 'Apoiar'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

SupportButton.displayName = 'SupportButton';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    fontSize: 20,
    color: '#666',
  },
  iconSupported: {
    color: '#43A047',
  },
  textContainer: {
    flex: 1,
  },
  countText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  countTextSupported: {
    color: '#43A047',
  },
  labelText: {
    fontSize: 13,
    color: '#666',
  },
  labelTextSupported: {
    color: '#43A047',
  },
});