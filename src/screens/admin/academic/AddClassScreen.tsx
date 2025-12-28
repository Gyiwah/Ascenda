import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BookOpen } from 'lucide-react-native';

import { useAuth } from '@/utils/useAuth';
import { classService } from '@/api/classes';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { useKeyboardAvoidance } from '@/hooks/useKeyboardAvoidance';
import { Class } from '@/types/database';

/**
 * AddClassScreen - Add or edit a class
 */
export default function AddClassScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { showToast } = useToast();
  const { user } = useAuth();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const keyboardAvoidance = useKeyboardAvoidance();

  const classId = route.params?.classId;
  const isEditing = !!classId;

  const [loading, setLoading] = useState(!!classId);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [academicYear, setAcademicYear] = useState('');

  // Level mapping: Primary = 1, JHS = 2, SHS = 3
  const levelOptions = [
    { label: 'Primary', value: '1' },
    { label: 'JHS', value: '2' },
    { label: 'SHS', value: '3' },
  ];

  const getLevelLabel = (levelNum: number | undefined): string => {
    if (!levelNum) return '';
    if (levelNum === 1) return '1';
    if (levelNum === 2) return '2';
    if (levelNum === 3) return '3';
    return levelNum.toString();
  };

  useEffect(() => {
    if (classId) {
      loadClass();
    }
    // Set default academic year to current year if not editing
    if (!classId) {
      const currentYear = new Date().getFullYear();
      setAcademicYear(`${currentYear}/${currentYear + 1}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const loadClass = async () => {
    setLoading(true);
    try {
      const { data, error } = await classService.getById(classId);
      if (error) throw error;
      if (data) {
        setName(data.name || '');
        setLevel(getLevelLabel(data.level));
        setAcademicYear(data.academic_year || '');
      }
    } catch (err: any) {
      console.error('[AddClassScreen] Error loading class:', err);
      showToast('Failed to load class', 'error');
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

    if (!name.trim()) {
      showToast('Please enter class name', 'warning');
      return;
    }
    if (!level.trim()) {
      showToast('Please select class level', 'warning');
      return;
    }
    const levelNum = parseInt(level.trim(), 10);
    if (isNaN(levelNum) || levelNum < 1 || levelNum > 3) {
      showToast('Please select a valid level', 'warning');
      return;
    }
    if (!academicYear.trim()) {
      showToast('Please enter academic year', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Class> = {
        name: name.trim(),
        level: levelNum,
        academic_year: academicYear.trim(),
        school_id: user.school_id,
        is_active: true,
      };

      if (isEditing) {
        const { error } = await classService.update(classId, payload);
        if (error) throw error;
        showToast('Class updated', 'success');
      } else {
        const { error } = await classService.create(payload);
        if (error) throw error;
        showToast('Class created', 'success');
      }

      navigation.goBack();
    } catch (err: any) {
      console.error('[AddClassScreen] Save error:', err);
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
          <Text style={styles.title}>{isEditing ? 'Edit Class' : 'New Class'}</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.iconContainer}>
            <BookOpen size={32} color={theme.colors.primary.base} />
          </View>

          <Input
            label="Class Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g., Form 1A, Grade 5B"
            style={styles.inputSpacing}
          />
          <Picker
            label="Level *"
            value={level}
            onValueChange={setLevel}
            options={levelOptions}
            placeholder="Select level"
            style={styles.pickerInput}
          />
          <Input
            label="Academic Year *"
            value={academicYear}
            onChangeText={setAcademicYear}
            placeholder="e.g., 2024/2025"
            style={styles.inputSpacing}
          />

          <Button
            title={isEditing ? 'Update Class' : 'Create Class'}
            onPress={handleSave}
            loading={submitting}
            style={styles.saveButton}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme> | any) => {
  const safeTheme = theme || {
    colors: {
      background: { primary: '#ffffff' },
      surface: { primary: '#ffffff' },
      text: { primary: '#000000', secondary: '#666666' },
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16 },
    typography: { fontSizes: { xs: 12, sm: 14, base: 16, lg: 18, '2xl': 24, '3xl': 30 }, fontWeights: { medium: '500', semibold: '600', bold: '700' } },
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: safeTheme.colors.background.primary,
    },
    scrollContent: {
      padding: theme.spacing.lg,
      backgroundColor: safeTheme.colors.background.primary,
    },
    header: {
      marginBottom: theme.spacing.lg,
      backgroundColor: safeTheme.colors.background.primary,
    },
    title: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
    },
    card: {
      padding: theme.spacing.lg,
      backgroundColor: safeTheme.colors.surface.primary,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    inputSpacing: {
      marginTop: theme.spacing.md,
      color: safeTheme.colors.text.primary,
      backgroundColor: safeTheme.colors.background.primary,
    },
    pickerInput: {
      marginTop: theme.spacing.md,
      color: safeTheme.colors.text.primary,
    },
    inputYear: {
      marginTop: theme.spacing.md,
      backgroundColor: safeTheme.colors.background.primary,
      color: safeTheme.colors.text.primary,
    },
    saveButton: {
      marginTop: theme.spacing.xl,
    },
  });
}
