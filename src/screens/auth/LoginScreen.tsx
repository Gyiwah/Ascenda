import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { useAuth } from '@/utils/useAuth';

import { useToast } from '@/components/ToastContext';
import { resetToRoute } from '@/navigation/navigationService';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { AlertCircle, Mail, Lock, User, Calendar, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
  const { signIn, signInStudent, error: authError } = useAuth();
  const navigation = useNavigation<any>();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginType, setLoginType] = useState<'staff' | 'student'>('staff');
  const [showPassword, setShowPassword] = useState(false);

  // Check if account is deactivated
  React.useEffect(() => {
    if (authError === 'ACCOUNT_DEACTIVATED') {
      // Small delay to ensure navigation is ready
      setTimeout(() => {
        navigation.navigate('AccountDeactivated');
      }, 100);
    }
  }, [authError, navigation]);

  const styles = React.useMemo(() => makeStyles(theme), [theme]);

  const handleLogin = async () => {
    setError('');

    if (loginType === 'student') {
      const cleanAdm = admissionNumber.trim();
      let cleanDob = dateOfBirth.trim().replace(/\//g, '-');

      if (!cleanAdm || !cleanDob) {
        setError('Please enter admission number and date of birth');
        return;
      }

      // Convert DD-MM-YYYY to YYYY-MM-DD
      const ddmmyyyy = cleanDob.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (ddmmyyyy) {
        cleanDob = `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
      }

      setLoading(true);
      const result = await signInStudent(cleanAdm, cleanDob);
      setLoading(false);

      if (!result.success) {
        setError(result.error || 'Login failed. Please check your credentials.');
        return;
      }

      showToast('Signed in successfully', 'success');
      resetToRoute('Student');
      return;
    } else {

      // Staff login: email + password
      if (!email.trim() || !password.trim()) {
        setError('Please enter email and password');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address');
        return;
      }

      setLoading(true);
      const result = await signIn(email.trim(), password);
      setLoading(false);

      if (!result.success) {
        setError(result.error || 'Login failed. Please check your credentials.');
        return;
      }

      // Successful sign-in: give user feedback and navigate if we have role info
      if (result.user) {
        // Map user role to navigator route
        const role = (result.user as any).role as string | undefined;
        let routeName: string | null = null;
        switch (role) {
          case 'super_admin':
            routeName = 'SuperAdmin';
            break;
          case 'admin':
            routeName = 'Admin';
            break;
          case 'headmaster':
            routeName = 'Headmaster';
            break;
          case 'teacher':
            routeName = 'Teacher';
            break;
          default:
            routeName = null;
        }

        if (routeName) {
          resetToRoute(routeName);
          return;
        }
      }
    }

    showToast('Signed in successfully', 'success');
  };

  const isFormValid = () => {
    if (loginType === 'student') {
      return admissionNumber.trim() && dateOfBirth.trim();
    }
    return email.trim() && password.trim();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.container}>
        {/* Fixed Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.tagline}>Sign in to access your account</Text>
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Login Card */}
            <View style={styles.card}>
              {/* Login Type Toggle - single Switch */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Staff</Text>
                <Switch
                  value={loginType === 'student'}
                  onValueChange={(val) => {
                    const newType = val ? 'student' : 'staff';
                    setLoginType(newType);
                    setError('');
                    // Clear fields from the other form
                    if (newType === 'student') {
                      setEmail('');
                      setPassword('');
                    } else {
                      setAdmissionNumber('');
                      setDateOfBirth('');
                    }
                  }}
                />
                <Text style={styles.switchLabel}>Student</Text>
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <AlertCircle size={18} color={theme.colors.error.base} />
                  <Text style={styles.error}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.form}>
                {loginType === 'staff' ? (
                  <>
                    <View style={styles.inputContainer}>
                      <View style={styles.inputIconContainer}>
                        <Mail size={20} color={theme.colors.text.secondary} />
                      </View>
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
                          style={styles.inputNoMargin}
                        />
                      </View>
                    </View>

                    <View style={[styles.inputContainer, styles.inputSpacing]}>
                      <View style={styles.inputIconContainer}>
                        <Lock size={20} color={theme.colors.text.secondary} />
                      </View>
                      <View style={styles.inputWrapper}>
                        <View style={styles.passwordInputContainer}>
                          <Input
                            label="Password"
                            value={password}
                            onChangeText={(text) => {
                              setPassword(text);
                              setError('');
                            }}
                            placeholder="Enter your password"
                            secureTextEntry={!showPassword}
                            autoComplete="password"
                            autoCorrect={false}
                            style={[styles.inputNoMargin, styles.passwordInput]}
                          />
                          <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                            activeOpacity={0.7}
                          >
                            {showPassword ? (
                              <EyeOff size={20} color={theme.colors.text.secondary} />
                            ) : (
                              <Eye size={20} color={theme.colors.text.secondary} />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.inputContainer}>
                      <View style={styles.inputIconContainer}>
                        <User size={20} color={theme.colors.text.secondary} />
                      </View>
                      <View style={styles.inputWrapper}>
                        <Input
                          label="Admission Number"
                          value={admissionNumber}
                          onChangeText={(text) => {
                            setAdmissionNumber(text);
                            setError('');
                          }}
                          placeholder="Enter your admission number"
                          autoCapitalize="none"
                          autoCorrect={false}
                          style={styles.inputNoMargin}
                        />
                      </View>
                    </View>

                    <View style={[styles.inputContainer, styles.inputSpacing]}>
                      <View style={styles.inputIconContainer}>
                        <Calendar size={20} color={theme.colors.text.secondary} />
                      </View>
                      <View style={styles.inputWrapper}>
                        <DatePicker
                          label="Date of Birth"
                          value={dateOfBirth}
                          onValueChange={(date) => {
                            setDateOfBirth(date);
                            setError('');
                          }}
                          placeholder="Select Date of Birth"
                          minYear={1995}
                          maxYear={new Date().getFullYear()}
                        />
                      </View>
                    </View>
                  </>
                )}


                <Button
                  title="Sign In"
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading || !isFormValid()}
                  style={styles.loginButton}
                />
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
      color: theme.colors.text.primary,
    },
    headerSection: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: Platform.OS === 'ios' ? theme.spacing['2xl'] : theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.background.primary,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: theme.spacing['2xl'],
    },
    logoContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
      shadowColor: theme.colors.background.dark ?? '#000',
      shadowOpacity: 0.1,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    logo: {
      width: 80,
      height: 80,
    },
    welcomeText: {
      fontSize: theme.typography.fontSizes['2xl'] * 1.2,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
      letterSpacing: -0.5,
    },
    tagline: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeights.medium,
    },
    card: {
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.lg,
      padding: theme.spacing.xl,
      borderRadius: 24,
      backgroundColor: theme.colors.surface.primary,
      shadowColor: theme.colors.background.dark ?? '#000',
      shadowOpacity: 0.1,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    toggleContainer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing.xs,
      borderRadius: 12,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing.xs,
      borderRadius: 12,
    },
    switchLabel: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeights.medium,
    },
    toggleButton: {
      flex: 1,
    },
    toggleButtonActive: {
      opacity: 1,
    },
    form: {
      marginTop: theme.spacing.md,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
    },
    inputIconContainer: {
      marginTop: theme.spacing.md + 20, // Align with input field
      width: 24,
      alignItems: 'center',
    },
    inputWrapper: {
      flex: 1,
    },
    inputNoMargin: {
      marginBottom: 0,
      backgroundColor: theme.colors.background.primary,
      color: theme.colors.text.primary,
      
    },
    inputSpacing: {
      marginTop: theme.spacing.md,
      color: theme.colors.text.primary,
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.error.light + '20',
      padding: theme.spacing.md,
      borderRadius: 12,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.error.light,
    },
    error: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.error.base,
      marginLeft: theme.spacing.sm,
      flex: 1,
      fontWeight: theme.typography.fontWeights.medium,
    },
    loginButton: {
      marginTop: theme.spacing.xl,
    },
    passwordInputContainer: {
      position: 'relative',
    },
    passwordInput: {
      paddingRight: 48,
    },
    eyeIcon: {
      position: 'absolute',
      right: theme.spacing.md,
      top: 20, // Aligns with input field (label height + margin)
      padding: theme.spacing.xs,
      zIndex: 1,
    },
  });
