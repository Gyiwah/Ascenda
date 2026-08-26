import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/theme';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

export function Toast({ message, type = 'info' }: ToastProps) {
  const theme = useAppTheme();

  const backgroundColor = {
    success: theme.mode === 'dark' ? '#064e3b' : (theme.colors.success[100] || '#dcfce7'),
    error: theme.mode === 'dark' ? '#7f1d1d' : (theme.colors.error[100] || '#fee2e2'),
    info: theme.mode === 'dark' ? '#22153e' : (theme.colors.primary[100] || '#ffe6d3'),
    warning: theme.mode === 'dark' ? '#78350f' : (theme.colors.warn[100] || '#fef3c7'),
  }[type];

  const textColor = {
    success: theme.mode === 'dark' ? '#6ee7b7' : (theme.colors.success.dark || '#047857'),
    error: theme.mode === 'dark' ? '#fca5a5' : (theme.colors.error.dark || '#c62828'),
    info: theme.mode === 'dark' ? '#f08a45' : (theme.colors.primary.dark || '#b74e0d'),
    warning: theme.mode === 'dark' ? '#fde68a' : (theme.colors.warn.dark || '#b45309'),
  }[type];

  const borderColor = {
    success: theme.colors.success.base,
    error: theme.colors.error.base,
    info: theme.colors.primary.base,
    warning: theme.colors.warn.base,
  }[type];

  return (
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 10,
    marginHorizontal: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});


