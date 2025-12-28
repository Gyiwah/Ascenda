import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Switch,
} from 'react-native';
import { useKeyboardAvoidance } from '@/hooks/useKeyboardAvoidance';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Users } from 'lucide-react-native';
import { userService } from '@/api/users';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { useAuth } from '@/utils/useAuth';
import { User } from '@/types/database';

export default function AddTeacherScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { showToast } = useToast();
  const { user } = useAuth();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const keyboardAvoidance = useKeyboardAvoidance();

  const userId = route.params?.userId;
  const isEditing = !!userId;

  const [loading, setLoading] = useState(!!userId);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadUser = async () => {
    setLoading(true);
    try {
      const { data, error } = await userService.getById(userId);
      if (error) throw error;
      if (data) {
        setEmail(data.email || '');
        setFullName(data.full_name || '');
        setIsActive(data.is_active ?? true);
      }
    } catch (err: any) {
      console.error('[AddTeacherScreen] Error loading teacher:', err);
      showToast('Failed to load teacher', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.school_id) {
      showToast('School ID not found', 'error');
      return;
    }

    if (!email.trim()) {
      showToast('Please enter email', 'warning');
      return;
    }
    if (!fullName.trim()) {
      showToast('Please enter full name', 'warning');
      return;
    }
    if (!isEditing && !temporaryPassword.trim()) {
      showToast('Please enter temporary password', 'warning');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast('Please provide a valid email', 'warning');
      return;
    }

    if (!isEditing && temporaryPassword.trim().length < 8) {
      showToast('Password should be at least 8 characters', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        const { error } = await userService.update(userId, {
          email: email.trim(),
          full_name: fullName.trim(),
          is_active: isActive,
        });
        if (error) throw error;
        showToast('Teacher updated', 'success');
      } else {
        // School admin uses create_school_user edge function
        const { error } = await userService.createSchoolUser(
          fullName.trim(),
          email.trim(),
          temporaryPassword.trim(),
          'teacher'
        );
        if (error) throw error;
        showToast('Teacher created', 'success');
      }

      navigation.goBack();
    } catch (err: any) {
      console.error('[AddTeacherScreen] Save error:', err);
      showToast(err?.message || 'Save failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={keyboardAvoidance.behavior}
      keyboardVerticalOffset={keyboardAvoidance.keyboardVerticalOffset}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardAvoidance.contentPaddingBottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{isEditing ? 'Edit Teacher' : 'Add Teacher'}</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.iconContainer}>
            <Users size={32} color={theme.colors.primary.base} />
          </View>

          <Input
            label="Full Name *"
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g., John Doe"
          />
          <Input
            label="Email *"
            value={email}
            onChangeText={setEmail}
            placeholder="e.g., john.doe@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.inputSpacing}
          />
          {!isEditing && (
            <Input
              label="Temporary Password *"
              value={temporaryPassword}
              onChangeText={setTemporaryPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              style={styles.inputSpacing}
            />
          )}

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Active</Text>
            <Switch value={isActive} onValueChange={setIsActive} />
          </View>

          <Button
            title={isEditing ? 'Update Teacher' : 'Add Teacher'}
            onPress={handleSave}
            loading={submitting}
            style={styles.saveButton}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    scrollContent: {
      padding: theme.spacing.lg,
    },
    header: {
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
    },
    card: {
      padding: theme.spacing.lg,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    inputSpacing: {
      marginTop: theme.spacing.md,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    switchLabel: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.primary,
    },
    saveButton: {
      marginTop: theme.spacing.xl,
    },
  });

