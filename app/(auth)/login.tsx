import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing, typography, hexToRgba } from '@/theme';
import { useFonts } from 'expo-font';
import { Mail, Lock, GraduationCap, AlertCircle } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load Dustrone font for the title only (with fallback if not available)
  let fontSource = {};
  try {
    fontSource = { 'Dustrone': require('../../assets/fonts/Dustrone-Regular.ttf') };
  } catch (e) {
    // Font file not found, will use system font fallback
  }
  const [fontsLoaded] = useFonts(fontSource);

  // Navigate based on user role after successful login
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'super_admin':
          router.replace('/(superadmin)/dashboard');
          break;
        case 'admin':
          router.replace('/(admin)/dashboard');
          break;
        case 'headmaster':
          router.replace('/(headmaster)/dashboard');
          break;
        case 'teacher':
          router.replace('/(teacher)/dashboard');
          break;
        default:
          // Student or other roles - stay on login or redirect as needed
          break;
      }
    }
  }, [user, router]);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
    // Navigation will happen automatically via useEffect when user state updates
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient
        colors={[colors.primary[600], colors.primary[700], colors.primary[800]]}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroContent}>
          <View style={styles.logoContainer}>
            <GraduationCap size={40} color={colors.text.inverse} strokeWidth={2} />
          </View>
        </View>
      </LinearGradient>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Text 
              style={[
                styles.title,
                fontsLoaded && { fontFamily: 'Dustrone' }
              ]}
            >
              Ascenda
            </Text>
            <Text style={styles.subtitle}>School Management System</Text>
            <Text style={styles.tagline}>Welcome back! Please sign in to continue.</Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={18} color={colors.error[600]} style={styles.errorIcon} />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Input
                label="Email Address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                style={[styles.input, styles.inputWithIcon]}
              />
              <Mail size={20} color={colors.text.secondary} style={styles.inputIcon} />
            </View>

            <View style={styles.inputWrapper}>
              <Input
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                placeholder="Enter your password"
                secureTextEntry
                autoComplete="password"
                autoCorrect={false}
                style={[styles.input, styles.inputWithIcon]}
              />
              <Lock size={20} color={colors.text.secondary} style={styles.inputIcon} />
            </View>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
              disabled={loading || !email || !password}
            />

            <Button
              title="Forgot Password?"
              onPress={() => router.push('/(auth)/forgot-password')}
              variant="outline"
              style={styles.forgotButton}
            />
          </View>
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
    height: 220,
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing['2xl'],
  },
    logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: hexToRgba(colors.background.light ?? '#ffffff', 0.25),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.background.dark ?? '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingBottom: spacing.xl,
  },
    card: {
    marginTop: -90,
    marginHorizontal: spacing.lg,
    padding: spacing['2xl'],
    borderRadius: 28,
    backgroundColor: colors.surface?.primary ?? '#ffffff',
    shadowColor: colors.background.dark ?? '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    paddingTop: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes['4xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.primary[600],
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: 2,
    // Dustrone font will be applied conditionally via inline style
  },
  subtitle: {
    fontSize: typography.fontSizes.lg,
    color: colors.text.primary,
    textAlign: 'center',
    fontWeight: typography.fontWeights.semibold,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  tagline: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  form: {
    marginTop: spacing.lg,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  inputIcon: {
    position: 'absolute',
    left: spacing.md + 12,
    bottom: spacing.sm + 12,
    zIndex: 1,
  },
  input: {
    marginBottom: 0,
  },
  inputWithIcon: {
    paddingLeft: spacing.lg + 20,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: colors.error[500],
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.error[500],
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  errorIcon: {
    marginRight: spacing.sm,
  },
  error: {
    fontSize: typography.fontSizes.sm,
    color: colors.error[600],
    textAlign: 'left',
    flex: 1,
    fontWeight: typography.fontWeights.medium,
  },
  loginButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  forgotButton: {
    marginTop: spacing.xs,
  },
});
