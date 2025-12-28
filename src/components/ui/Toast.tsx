import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/theme';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

export function Toast({ message, type = 'info' }: ToastProps) {
  const backgroundColor = {
    success: colors.success[100],
    error: colors.error[100],
    info: colors.primary[100],
    warning: colors.warning[100],
  }[type];

  const textColor = {
    success: colors.success[700],
    error: colors.error[700],
    info: colors.primary[700],
    warning: colors.warning[700],
  }[type];

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: 8,
    marginHorizontal: spacing.lg,
  },
  text: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
});

