import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/theme';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, message, icon }: EmptyStateProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    iconContainer: {
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
    message: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
  });

