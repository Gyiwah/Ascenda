import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CheckCircle } from 'lucide-react-native';
import { userService } from '@/api/users';
import { schoolService } from '@/api/schools';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { School, UserRole } from '@/types/database';

const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
  { label: 'super_admin', value: 'super_admin' },
  { label: 'admin', value: 'admin' },
  { label: 'headmaster', value: 'headmaster' },
  { label: 'teacher', value: 'teacher' },
  { label: 'student', value: 'student' },
];

export default function AddUserScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const userId = route.params?.userId;
  const isEditing = !!userId;

  const [loading, setLoading] = useState(!!userId);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [schoolId, setSchoolId] = useState<string | undefined>(undefined);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [schools, setSchools] = useState<School[]>([]);

  useEffect(() => {
    loadSchools();
    if (userId) {
      loadUser();
    }
  }, [userId]);

  const loadSchools = async () => {
    try {
      const { data } = await schoolService.getAll();
      setSchools(data || []);
    } catch (err) {
      console.error('Error loading schools', err);
    }
  };

  const loadUser = async () => {
    setLoading(true);
    try {
      const { data, error } = await userService.getById(userId);
      if (error) throw error;
      if (data) {
        setEmail(data.email || '');
        setFullName(data.full_name || '');
        setRole((data.role || 'student') as UserRole);
        setSchoolId(data.school_id);
        setIsActive(data.is_active ?? true);
      }
    } catch (err: any) {
      console.error('Error loading user', err);
      showToast('Failed to load user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!email.trim()) {
      showToast('Please enter email', 'warning');
      return;
    }
    if (!fullName.trim()) {
      showToast('Please enter full name', 'warning');
      return;
    }
    
    // Students should be created in the students table, not users table
    if (!isEditing && role === 'student') {
      showToast('Students should be created from the Students screen', 'warning');
      // Optionally navigate to AddStudent screen if it exists for super admin
      return;
    }

    if (!isEditing && !temporaryPassword.trim()) {
      showToast('Please enter temporary password', 'warning');
      return;
    }
    if (!isEditing && temporaryPassword.trim().length < 8) {
      showToast('Temporary password should be at least 8 characters', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        const payload: Partial<any> = {
          email,
          full_name: fullName,
          role: role as any,
          school_id: schoolId,
          is_active: isActive,
        };
        const res = await userService.update(userId, payload);
        if (res.error) throw res.error;
        showToast('User updated', 'success');
      } else {
        const res = await userService.inviteUser(email, fullName, role, schoolId, temporaryPassword);
        if (res.error) throw res.error;
        showToast('User created with temporary password', 'success');
      }

      navigation.goBack();
    } catch (err: any) {
      console.error('Save user error', err);
      showToast(err?.message || 'Save failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  const schoolOptions = schools.map((school) => ({
    label: school.name,
    value: school.id,
    meta: school.code,
  }));

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>{isEditing ? 'Edit User' : 'New User'}</Text>
      </View>

      <Card style={styles.card}>
        <Input
          label="Email *"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isEditing}
        />
        <Input label="Full Name *" value={fullName} onChangeText={setFullName} style={styles.inputSpacing} />
        {!isEditing && (
          <Input
            label="Temporary Password *"
            value={temporaryPassword}
            onChangeText={setTemporaryPassword}
            secureTextEntry
            style={styles.inputSpacing}
            placeholder="Minimum 8 characters"
          />
        )}
        <Picker
          label="Role *"
          value={role}
          onValueChange={(value) => setRole(value as UserRole)}
          options={ROLE_OPTIONS.map(({ label, value }) => ({ label, value }))}
          style={styles.inputSpacing}
        />
        <Picker
          label="School (optional)"
          value={schoolId ?? ''}
          onValueChange={(value) => setSchoolId(value || undefined)}
          options={[{ label: 'None', value: '' }, ...schoolOptions]}
          style={styles.inputSpacing}
        />

        {isEditing && (
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelRow}>
              <CheckCircle size={20} color={theme.colors.text.secondary} />
              <Text style={styles.settingLabel}>Active</Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary.light,
              }}
              thumbColor={
                isActive
                  ? theme.colors.primary.base
                  : theme.colors.text.secondary
              }
            />
          </View>
        )}
      </Card>

      <View style={styles.actions}>
        <Button title="Cancel" onPress={() => navigation.goBack()} variant="ghost" />
        <View style={{ width: theme.spacing.sm }} />
        <Button title={isEditing ? 'Update' : 'Create'} onPress={handleSave} loading={submitting} disabled={submitting} />
      </View>
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
      paddingBottom: theme.spacing['2xl'],
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
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.lg,
    },
    inputSpacing: {
      marginTop: theme.spacing.md,
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      marginTop: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    toggleLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    settingLabel: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.colors.text.primary,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: theme.spacing.lg,
    },
  });

