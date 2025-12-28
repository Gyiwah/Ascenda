import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing, typography } from '@/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Failed to send reset email');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.hero} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we will send you a link to reset your password
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? (
            <Text style={styles.success}>
              Password reset email sent! Please check your inbox.
            </Text>
          ) : null}

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Button
            title="Send Reset Link"
            onPress={handleResetPassword}
            loading={loading}
            style={styles.resetButton}
          />

          <Button
            title="Back to Login"
            onPress={() => router.back()}
            variant="outline"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  hero: {
    height: 120,
    backgroundColor: colors.primary[600],
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  card: {
    marginTop: -60,
    marginHorizontal: spacing.xl,
    padding: spacing.xl,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: colors.background.dark ?? '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  error: {
    fontSize: typography.fontSizes.sm,
    color: colors.error[500],
    textAlign: 'center',
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.error[500] + '15',
    borderRadius: 8,
  },
  success: {
    fontSize: typography.fontSizes.sm,
    color: colors.success[600],
    textAlign: 'center',
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.success[500] + '15',
    borderRadius: 8,
  },
  resetButton: {
    marginBottom: spacing.md,
  },
});
