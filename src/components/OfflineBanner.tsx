import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WifiOff, AlertCircle } from 'lucide-react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAppTheme } from '@/theme/@ThemeProvider';

/**
 * OfflineBanner - Shows when device is offline with helpful message
 * Automatically appears/disappears based on network status
 */
export function OfflineBanner() {
  const { isOnline, isLoading } = useNetworkStatus();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  if (isLoading || isOnline) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <WifiOff size={16} color={theme.colors.error.base} />
      <View style={styles.content}>
        <Text style={styles.title}>You&apos;re Offline</Text>
        <Text style={styles.message}>
          Viewing cached data. Some features may be limited.
        </Text>
      </View>
      <AlertCircle size={16} color={theme.colors.error.base} />
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    banner: {
      backgroundColor: theme.colors.error.base + '15',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.error.base,
      padding: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    content: {
      flex: 1,
      marginHorizontal: theme.spacing.sm,
    },
    title: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.error.base,
    },
    message: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.error.base,
      opacity: 0.8,
      marginTop: 2,
    },
  });
