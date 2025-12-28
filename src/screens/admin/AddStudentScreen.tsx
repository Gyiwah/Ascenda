import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GraduationCap } from 'lucide-react-native';

import { useAuth } from '@/utils/useAuth';
import { studentService } from '@/api/students';
import { classService } from '@/api/classes';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { Student, Class, School } from '@/types/database';
import { schoolService } from '@/api/schools';
import { useKeyboardAvoidance } from '@/hooks/useKeyboardAvoidance';

export default function AddStudentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { showToast } = useToast();
  const { user } = useAuth();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const keyboardAvoidance = useKeyboardAvoidance();

  const studentId = route.params?.studentId;
  const initialClassId = route.params?.classId;
  const schoolIdParam = route.params?.schoolId; // For super admin
  const isEditing = !!studentId;

  const [loading, setLoading] = useState(!!studentId);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState(initialClassId || '');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');

  // Check if user is super admin (can select school)
  const isSuperAdmin = user?.role === 'super_admin';

  const genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
  ];

  useEffect(() => {
    if (isSuperAdmin) {
      loadSchools();
    } else {
      loadClasses();
    }
    if (studentId) {
      loadStudent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, isSuperAdmin]);

  // Load classes when school is selected (for super admin)
  useEffect(() => {
    if (isSuperAdmin && selectedSchoolId) {
      loadClasses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchoolId, isSuperAdmin]);

  const loadSchools = async () => {
    setLoadingSchools(true);
    try {
      const { data, error } = await schoolService.getAll();
      if (error) throw error;
      setSchools(data || []);
      // If schoolId is provided in params, set it
      if (schoolIdParam && !selectedSchoolId) {
        setSelectedSchoolId(schoolIdParam);
      }
    } catch (err: any) {
      console.error('[AddStudentScreen] Error loading schools:', err);
      showToast('Failed to load schools', 'error');
    } finally {
      setLoadingSchools(false);
    }
  };

  const loadClasses = async () => {
    // Support both super admin (can select school) and school admin (uses their school_id)
    const schoolIdToUse = isSuperAdmin ? selectedSchoolId : (user?.school_id || route.params?.schoolId);
    if (!schoolIdToUse) {
      setLoadingClasses(false);
      setClasses([]);
      return;
    }
    
    setLoadingClasses(true);
    try {
      const { data, error } = await classService.getAll(schoolIdToUse);
      if (error) throw error;
      setClasses(data || []);
      if (initialClassId && !selectedClassId) {
        setSelectedClassId(initialClassId);
      }
    } catch (err: any) {
      console.error('[AddStudentScreen] Error loading classes:', err);
      showToast('Failed to load classes', 'error');
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadStudent = async () => {
    setLoading(true);
    try {
      const { data, error } = await studentService.getById(studentId);
      if (error) throw error;
      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setAdmissionNumber(data.admission_number || '');
        setDateOfBirth(data.date_of_birth || '');
        setGender(data.gender || '');
        setSelectedClassId(data.class_id || '');
        // If super admin, also set the school
        if (isSuperAdmin && data.school_id) {
          setSelectedSchoolId(data.school_id);
        }
      }
    } catch (err: any) {
      console.error('[AddStudentScreen] Error loading student:', err);
      showToast('Failed to load student', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Support both super admin (can select school) and school admin (uses their school_id)
    const schoolIdToUse = isSuperAdmin ? selectedSchoolId : (user?.school_id || route.params?.schoolId);
    if (!schoolIdToUse) {
      showToast('Please select a school', 'error');
      return;
    }

    if (!firstName.trim()) {
      showToast('Please enter first name', 'warning');
      return;
    }
    if (!lastName.trim()) {
      showToast('Please enter last name', 'warning');
      return;
    }
    if (!admissionNumber.trim()) {
      showToast('Please enter admission number', 'warning');
      return;
    }
    if (!selectedClassId) {
      showToast('Please select a class', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Student> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        admission_number: admissionNumber.trim(),
        class_id: selectedClassId,
        school_id: schoolIdToUse,
        is_active: true,
      };

      if (dateOfBirth.trim()) {
        payload.date_of_birth = dateOfBirth.trim();
      }
      if (gender.trim()) {
        payload.gender = gender.trim();
      }

      if (isEditing) {
        const { error } = await studentService.update(studentId, payload);
        if (error) throw error;
        showToast('Student updated', 'success');
      } else {
        const { error } = await studentService.create(payload);
        if (error) throw error;
        showToast('Student created', 'success');
      }

      navigation.goBack();
    } catch (err: any) {
      console.error('[AddStudentScreen] Save error:', err);
      showToast(err?.message || 'Save failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingClasses || loadingSchools) return <Loader />;

  const schoolOptions = schools.map((s) => ({
    label: s.name,
    value: s.id,
    meta: s.code,
  }));

  const classOptions = classes.map((c) => ({
    label: `${c.name} (${c.academic_year})`,
    value: c.id,
  }));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={keyboardAvoidance.behavior}
      keyboardVerticalOffset={keyboardAvoidance.keyboardVerticalOffset}
    >
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardAvoidance.contentPaddingBottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>{isEditing ? 'Edit Student' : 'Add Student'}</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.iconContainer}>
            <GraduationCap size={32} color={theme.colors.primary.base} />
          </View>

          {isSuperAdmin && (
            <Picker
              label="School *"
              value={selectedSchoolId}
              onValueChange={setSelectedSchoolId}
              options={schoolOptions}
              placeholder="Select a school"
            />
          )}
          <Picker
            label="Class *"
            value={selectedClassId}
            onValueChange={setSelectedClassId}
            options={classOptions}
            placeholder={isSuperAdmin && !selectedSchoolId ? "Select a school first" : "Select a class"}
            disabled={isSuperAdmin && !selectedSchoolId}
            style={styles.inputSpacing}
          />
          <Input
            label="First Name *"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="e.g., John"
            style={styles.inputSpacing}
          />
          <Input
            label="Last Name *"
            value={lastName}
            onChangeText={setLastName}
            placeholder="e.g., Doe"
            style={styles.inputSpacing}
          />
          <Input
            label="Admission Number *"
            value={admissionNumber}
            onChangeText={setAdmissionNumber}
            placeholder="e.g., STU001"
            style={styles.inputSpacing}
          />
          <Input
            label="Date of Birth"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="YYYY-MM-DD"
            style={styles.inputSpacing}
          />
          <Picker
            label="Gender"
            value={gender}
            onValueChange={setGender}
            options={genderOptions}
            placeholder="Select gender"
            style={styles.inputSpacing}
          />

          <Button
            title={isEditing ? 'Update Student' : 'Add Student'}
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
    saveButton: {
      marginTop: theme.spacing.xl,
    },
  });

