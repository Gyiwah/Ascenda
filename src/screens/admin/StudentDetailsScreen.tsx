import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { GraduationCap, Hash, Building2, Edit2, Calendar, User } from 'lucide-react-native';

import { studentService } from '@/api/students';
import { classService } from '@/api/classes';
import { schoolService } from '@/api/schools';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { Student } from '@/types/database';

export default function StudentDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const studentId = route.params?.studentId;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [classData, setClassData] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);

  // Auto-refresh on screen focus
  useFocusEffect(
    React.useCallback(() => {
      if (studentId) {
        loadData();
      }
    }, [studentId])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const studentRes = await studentService.getById(studentId);
      if (studentRes.error) throw studentRes.error;
      setStudent(studentRes.data);

      if (studentRes.data) {
        // Load class data
        if (studentRes.data.class_id) {
          const classRes = await classService.getById(studentRes.data.class_id);
          if (!classRes.error && classRes.data) {
            setClassData(classRes.data);
          }
        }

        // Load school data
        if (studentRes.data.school_id) {
          const schoolRes = await schoolService.getById(studentRes.data.school_id);
          if (!schoolRes.error && schoolRes.data) {
            setSchool(schoolRes.data);
          }
        }
      }
    } catch (err: any) {
      console.error('[StudentDetailsScreen] Error loading student details', err);
      showToast('Failed to load student details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return <Loader />;
  if (!student) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Student not found</Text>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary.base}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <GraduationCap size={32} color={theme.colors.text.inverse} />
        </View>
        <Text style={styles.studentName}>
          {student.first_name} {student.last_name}
        </Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Student</Text>
        </View>
      </View>

      <Card style={styles.card}>
        <View style={styles.infoRow}>
          <Hash size={20} color={theme.colors.text.secondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Admission Number</Text>
            <Text style={styles.infoValue}>{student.admission_number}</Text>
          </View>
        </View>

        {classData && (
          <View style={[styles.infoRow, styles.infoRowSpacing]}>
            <User size={20} color={theme.colors.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Class</Text>
              <Text style={styles.infoValue}>{classData.name}</Text>
              <Text style={styles.infoSubValue}>Academic Year: {classData.academic_year}</Text>
            </View>
          </View>
        )}

        {school && (
          <View style={[styles.infoRow, styles.infoRowSpacing]}>
            <Building2 size={20} color={theme.colors.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>School</Text>
              <Text style={styles.infoValue}>{school.name}</Text>
              <Text style={styles.infoSubValue}>Code: {school.code}</Text>
            </View>
          </View>
        )}

        {student.gender && (
          <View style={[styles.infoRow, styles.infoRowSpacing]}>
            <User size={20} color={theme.colors.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{student.gender}</Text>
            </View>
          </View>
        )}

        {student.date_of_birth && (
          <View style={[styles.infoRow, styles.infoRowSpacing]}>
            <Calendar size={20} color={theme.colors.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>{formatDate(student.date_of_birth)}</Text>
            </View>
          </View>
        )}

        {student.created_at && (
          <View style={[styles.infoRow, styles.infoRowSpacing]}>
            <Calendar size={20} color={theme.colors.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Enrolled</Text>
              <Text style={styles.infoValue}>{formatDate(student.created_at)}</Text>
            </View>
          </View>
        )}

        <View style={[styles.infoRow, styles.infoRowSpacing]}>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={[styles.statusBadge, student.is_active ? styles.statusActive : styles.statusInactive]}>
              <Text style={[styles.statusText, student.is_active ? styles.statusTextActive : styles.statusTextInactive]}>
                {student.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <View style={styles.actions}>
        <Button
          title="Edit Student"
          onPress={() => navigation.navigate('AddStudent', { studentId: student.id, classId: student.class_id })}
          icon={<Edit2 size={18} color={theme.colors.text.inverse} />}
        />
      </View>
    </ScrollView>
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
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary.base,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    studentName: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    roleBadge: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.roundness / 2,
      backgroundColor: theme.colors.primary.base + '1A',
    },
    roleText: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.colors.text.secondary,
      textTransform: 'capitalize',
    },
    card: {
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.lg,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
    },
    infoRowSpacing: {
      marginTop: theme.spacing.lg,
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs / 2,
    },
    infoValue: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.colors.text.primary,
    },
    infoSubValue: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs / 2,
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs / 2,
      borderRadius: theme.roundness / 2,
    },
    statusActive: {
      backgroundColor: theme.colors.primary.base + '1A',
    },
    statusInactive: {
      backgroundColor: theme.colors.text.secondary + '1A',
    },
    statusText: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.medium,
    },
    statusTextActive: {
      color: theme.colors.primary.base,
    },
    statusTextInactive: {
      color: theme.colors.text.secondary,
    },
    actions: {
      marginTop: theme.spacing.md,
    },
    errorText: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.error.base,
      textAlign: 'center',
      marginTop: theme.spacing.xl,
    },
  });

