import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { useNavigation } from '@react-navigation/native';

/**
 * AccountDeactivatedScreen - Displayed when user account is deactivated
 */
export default function AccountDeactivatedScreen() {
  const navigation = useNavigation<any>();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const handleGoToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.iconContainer}>
          <AlertCircle size={64} color={theme.colors.error.base} />
        </View>
        <Text style={styles.title}>Account Deactivated</Text>
        <Text style={styles.message}>
          Your account has been deactivated. Please contact an administrator to reactivate your account.
        </Text>
        <Button
          title="Go to Login"
          onPress={handleGoToLogin}
          style={styles.button}
        />
      </Card>
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    card: {
      padding: theme.spacing['2xl'],
      alignItems: 'center',
      maxWidth: 400,
    },
    iconContainer: {
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    message: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
      lineHeight: theme.typography.lineHeights.relaxed * theme.typography.fontSizes.base,
    },
    button: {
      minWidth: 200,
    },
  });

