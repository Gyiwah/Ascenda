import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/theme';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react-native';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
}

export function Toast({ message, type = 'info' }: ToastProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const getColors = () => {
    const isDark = theme.mode === 'dark';
    switch (type) {
      case 'success':
        return {
          bg: isDark ? '#064e3b' : (theme.colors.success[50] || '#f0fdf4'),
          border: theme.colors.success.base,
          text: isDark ? '#6ee7b7' : (theme.colors.success.dark || '#047857'),
          icon: theme.colors.success.base,
        };
      case 'error':
        return {
          bg: isDark ? '#7f1d1d' : (theme.colors.error[50] || '#fef2f2'),
          border: theme.colors.error.base,
          text: isDark ? '#fca5a5' : (theme.colors.error.dark || '#c62828'),
          icon: theme.colors.error.base,
        };
      case 'warning':
        return {
          bg: isDark ? '#78350f' : (theme.colors.warn[50] || '#fffbeb'),
          border: theme.colors.warn.base,
          text: isDark ? '#fde68a' : (theme.colors.warn.dark || '#b45309'),
          icon: theme.colors.warn.base,
        };
      default:
        return {
          bg: isDark ? '#281a40' : (theme.colors.primary[50] || '#fff3e9'),
          border: theme.colors.primary.base,
          text: isDark ? '#f08a45' : (theme.colors.primary.dark || '#b74e0d'),
          icon: theme.colors.primary.base,
        };
    }
  };

  const colors_ = getColors();
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : type === 'warning' ? AlertCircle : Info;

  return (
    <View style={[styles.container, { backgroundColor: colors_.bg, borderLeftColor: colors_.border }]}>
      <Icon size={20} color={colors_.icon} style={styles.icon} />
      <Text style={[styles.text, { color: colors_.text }]}>{message}</Text>
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.background.dark ?? '#000',
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    icon: {
      marginRight: theme.spacing.sm,
    },
    text: {
      flex: 1,
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.medium,
    },
  });

