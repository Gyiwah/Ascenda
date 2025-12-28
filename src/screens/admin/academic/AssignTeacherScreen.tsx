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
import { UserCheck } from 'lucide-react-native';

import { useAuth } from '@/utils/useAuth';
import { teacherAssignmentService } from '@/api/teacherAssignments';
import { classService } from '@/api/classes';
import { subjectService } from '@/api/subjects';
import { userService } from '@/api/users';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { useKeyboardAvoidance } from '@/hooks/useKeyboardAvoidance';
import { Class, Subject, User } from '@/types/database';

/**
 * AssignTeacherScreen - Assign a teacher to a class and subject
 */
export default function AssignTeacherScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { showToast } = useToast();
  const { user } = useAuth();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const keyboardAvoidance = useKeyboardAvoidance();

  const assignmentId = route.params?.assignmentId;
  const isEditing = !!assignmentId;

  const [loading, setLoading] = useState(!!assignmentId);
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [academicYear, setAcademicYear] = useState('');

  useEffect(() => {
    loadInitialData();
    if (assignmentId) {
      loadAssignment();
    } else {
      // Set default academic year to current year if not editing
      const currentYear = new Date().getFullYear();
      setAcademicYear(`${currentYear}/${currentYear + 1}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.school_id, assignmentId]);

  const loadInitialData = async () => {
    if (!user?.school_id) return;

    setLoadingData(true);
    try {
      // Load teachers, classes, and subjects in parallel
      const [teachersRes, classesRes, subjectsRes] = await Promise.all([
        userService.getByRole('teacher', user.school_id),
        classService.getAll(user.school_id),
        subjectService.getAll(user.school_id),
      ]);

      if (teachersRes.data) setTeachers(teachersRes.data);
      if (classesRes.data) setClasses(classesRes.data);
      if (subjectsRes.data) setSubjects(subjectsRes.data);
    } catch (err: any) {
      console.error('[AssignTeacherScreen] Error loading data:', err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  const loadAssignment = async () => {
    setLoading(true);
    try {
      const { data, error } = await teacherAssignmentService.getById(assignmentId);
      if (error) throw error;
      if (data) {
        setSelectedTeacherId(data.teacher_id || '');
        setSelectedClassId(data.class_id || '');
        setSelectedSubjectId(data.subject_id || '');
        setAcademicYear(data.academic_year || '');
      }
    } catch (err: any) {
      console.error('[AssignTeacherScreen] Error loading assignment:', err);
      showToast('Failed to load assignment', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTeacherId) {
      showToast('Please select a teacher', 'warning');
      return;
    }
    if (!selectedClassId) {
      showToast('Please select a class', 'warning');
      return;
    }
    if (!selectedSubjectId) {
      showToast('Please select a subject', 'warning');
      return;
    }
    if (!academicYear.trim()) {
      showToast('Please enter academic year', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        teacher_id: selectedTeacherId,
        class_id: selectedClassId,
        subject_id: selectedSubjectId,
        academic_year: academicYear.trim(),
      };

      if (isEditing) {
        const { error } = await teacherAssignmentService.update(assignmentId, payload);
        if (error) throw error;
        showToast('Assignment updated', 'success');
      } else {
        const { error } = await teacherAssignmentService.create(payload);
        if (error) throw error;
        showToast('Teacher assigned', 'success');
      }

      navigation.goBack();
    } catch (err: any) {
      console.error('[AssignTeacherScreen] Save error:', err);
      showToast(err?.message || 'Save failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingData) return <Loader />;

  const teacherOptions = teachers.map((t) => ({
    label: `${t.full_name} (${t.email})`,
    value: t.id,
  }));

  const classOptions = classes.map((c) => ({
    label: `${c.name} (Level ${c.level})`,
    value: c.id,
  }));

  const subjectOptions = subjects.map((s) => ({
    label: `${s.name} (${s.code})`,
    value: s.id,
  }));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={keyboardAvoidance.behavior}
      keyboardVerticalOffset={keyboardAvoidance.keyboardVerticalOffset}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardAvoidance.contentPaddingBottom }]}> 
        <View style={styles.header}>
          <Text style={styles.title}>{isEditing ? 'Edit Assignment' : 'Assign Teacher'}</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.iconContainer}>
            <UserCheck size={32} color={theme.colors.primary.base} />
          </View>

          <Picker
            label="Teacher *"
            value={selectedTeacherId}
            onValueChange={setSelectedTeacherId}
            options={teacherOptions}
            placeholder="Select a teacher"
          />
          <Picker
            label="Class *"
            value={selectedClassId}
            onValueChange={setSelectedClassId}
            options={classOptions}
            placeholder="Select a class"
            style={styles.inputSpacing}
          />
          <Picker
            label="Subject *"
            value={selectedSubjectId}
            onValueChange={setSelectedSubjectId}
            options={subjectOptions}
            placeholder="Select a subject"
            style={styles.inputSpacing}
          />
          <Input
            label="Academic Year *"
            value={academicYear}
            onChangeText={setAcademicYear}
            placeholder="e.g., 2024/2025"
            style={styles.inputYear}
          />
          <Button
            title="Set Current Academic Year"
            onPress={() => {
              const currentYear = new Date().getFullYear();
              setAcademicYear(`${currentYear}/${currentYear + 1}`);
            }}
            variant="ghost"
            style={styles.yearButton}
          />

          <Button
            title={isEditing ? 'Update Assignment' : 'Assign Teacher'}
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
      backgroundColor: theme.colors.surface.primary,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    inputSpacing: {
      marginTop: theme.spacing.md,
      color: theme.colors.text.primary,
    },
    inputYear: {
      marginTop: theme.spacing.md,
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.background.primary,
    },
    yearButton: {
      marginTop: theme.spacing.sm,
    },
    saveButton: {
      marginTop: theme.spacing.xl,
    },
  });

