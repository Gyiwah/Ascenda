import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Alert } from 'react-native';
import { useKeyboardAvoidance } from '@/hooks/useKeyboardAvoidance';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '@/utils/useAuth';
import { getStudentsForClass } from '@/api/teacher/students';
import { getRemarksForClass, saveRemarks, RemarkData } from '@/api/teacher/remarks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { RemarkInputCard } from '@/components/teacher/RemarkInputCard';
import { Student } from '@/types/database';
import * as Haptics from 'expo-haptics';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface RemarkDataLocal {
  studentId: string;
  behaviorRemark: string;
  performanceRemark: string;
  attendanceRemark: string;
}

export default function RemarkEntryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isOnline } = useNetworkStatus();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const keyboardAvoidance = useKeyboardAvoidance();

  const classId = route.params?.classId;
  const className = route.params?.className || 'Class';

  const [students, setStudents] = useState<Student[]>([]);
  const [remarks, setRemarks] = useState<Record<string, RemarkDataLocal>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const currentYear = new Date().getFullYear();
  const defaultAcademicYear = `${currentYear}/${currentYear + 1}`;
  const [academicYear, setAcademicYear] = useState<string>(defaultAcademicYear);
  const [term, setTerm] = useState<number>(1);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    if (classId && user?.school_id) {
      loadData();
    }
  }, [classId, user?.school_id, academicYear, term]);

  const loadData = async () => {
    if (!classId || !user?.school_id) return;

    setLoading(true);
    try {
      // Load students
      const { data: studentsData, error: studentsError } = await getStudentsForClass(classId, user.school_id);
      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Load existing remarks
      const { data: existingRemarks, error: remarksError } = await getRemarksForClass(
        classId,
        academicYear,
        term
      );

      if (remarksError) {
        console.warn('[RemarkEntryScreen] Error loading remarks:', remarksError);
      }

      // Initialize remarks from existing data or empty
      const initialRemarks: Record<string, RemarkDataLocal> = {};
      (studentsData || []).forEach((student) => {
        const existing = existingRemarks?.find((r) => r.student_id === student.id);
        if (existing?.remark_text) {
          // Parse combined remark text
          const text = existing.remark_text;
          const behaviorMatch = text.match(/Behavior:\s*(.+?)(?:\n\n|$)/s);
          const performanceMatch = text.match(/Performance:\s*(.+?)(?:\n\n|$)/s);
          const attendanceMatch = text.match(/Attendance:\s*(.+?)(?:\n\n|$)/s);
          
          initialRemarks[student.id] = {
            studentId: student.id,
            behaviorRemark: behaviorMatch?.[1]?.trim() || '',
            performanceRemark: performanceMatch?.[1]?.trim() || '',
            attendanceRemark: attendanceMatch?.[1]?.trim() || '',
          };
        } else {
          initialRemarks[student.id] = {
            studentId: student.id,
            behaviorRemark: '',
            performanceRemark: '',
            attendanceRemark: '',
          };
        }
      });

      setRemarks(initialRemarks);
      
      if (existingRemarks && existingRemarks.length > 0) {
        const latest = existingRemarks.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        setLastSaved(new Date(latest.created_at).toLocaleString());
      }
    } catch (err: any) {
      console.error('[RemarkEntryScreen] Error loading data:', err);
      showToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemarkChange = (
    studentId: string,
    type: 'behavior' | 'performance' | 'attendance',
    value: string
  ) => {
    setRemarks((prev) => {
      const updated = { ...prev };
      if (!updated[studentId]) {
        updated[studentId] = {
          studentId,
          behaviorRemark: '',
          performanceRemark: '',
          attendanceRemark: '',
        };
      }
      if (type === 'behavior') {
        updated[studentId].behaviorRemark = value;
      } else if (type === 'performance') {
        updated[studentId].performanceRemark = value;
      } else {
        updated[studentId].attendanceRemark = value;
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!user?.id || !classId) return;

    Alert.alert(
      'Submit Final Remarks',
      'Are you sure you want to submit these remarks?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              const remarksToSubmit: RemarkData[] = students.map((student) => {
                const remark = remarks[student.id] || {
                  behaviorRemark: '',
                  performanceRemark: '',
                  attendanceRemark: '',
                };
                return {
                  student_id: student.id,
                  class_id: classId,
                  academic_year: academicYear,
                  term: term,
                  behavior_remark: remark.behaviorRemark,
                  performance_remark: remark.performanceRemark,
                  attendance_remark: remark.attendanceRemark,
                  teacher_id: user.id,
                };
              });

              const { error } = await saveRemarks(remarksToSubmit);
              if (error) throw error;

              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('Remarks submitted successfully', 'success');
              setLastSaved(new Date().toLocaleString());
            } catch (err: any) {
              console.error('[RemarkEntryScreen] Submit error:', err);
              showToast(err?.message || 'Failed to submit remarks', 'error');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return <Loader />;

  const termOptions = [
    { label: 'Term 1', value: '1' },
    { label: 'Term 2', value: '2' },
    { label: 'Term 3', value: '3' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={keyboardAvoidance.behavior}
      keyboardVerticalOffset={keyboardAvoidance.keyboardVerticalOffset}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: keyboardAvoidance.contentPaddingBottom }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <Text style={styles.className}>{className}</Text>
          
          <View style={styles.filtersRow}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Academic Year</Text>
              <Input
                value={academicYear}
                onChangeText={setAcademicYear}
                keyboardType="numeric"
                style={styles.filterInput}
              />
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Term</Text>
              <Picker
                value={term.toString()}
                onValueChange={(value) => setTerm(parseInt(value, 10))}
                options={termOptions}
                style={styles.filterPicker}
              />
            </View>
          </View>

          {!isOnline && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineText}>Offline — changes saved locally</Text>
            </View>
          )}

          {lastSaved && (
            <Text style={styles.lastSaved}>Last saved: {lastSaved}</Text>
          )}
        </Card>

        {/* Remarks List */}
        <View style={styles.remarksContainer}>
          {students.map((student) => {
            const remark = remarks[student.id] || {
              behaviorRemark: '',
              performanceRemark: '',
              attendanceRemark: '',
            };
            return (
              <RemarkInputCard
                key={student.id}
                student={student}
                behaviorRemark={remark.behaviorRemark}
                performanceRemark={remark.performanceRemark}
                attendanceRemark={remark.attendanceRemark}
                onBehaviorChange={(value) => handleRemarkChange(student.id, 'behavior', value)}
                onPerformanceChange={(value) => handleRemarkChange(student.id, 'performance', value)}
                onAttendanceChange={(value) => handleRemarkChange(student.id, 'attendance', value)}
                lastSaved={lastSaved || undefined}
              />
            );
          })}
        </View>

        {/* Submit Button */}
        <Button
          title="Submit Final Remarks"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitButton}
        />
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
    scrollView: {
      flex: 1,
    },
    content: {
      padding: theme.spacing.lg,
    },
    headerCard: {
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.lg,
    },
    className: {
      fontSize: theme.typography.fontSizes.xl,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    filtersRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    filterItem: {
      flex: 1,
    },
    filterLabel: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
    },
    filterInput: {
      marginBottom: 0,
    },
    filterPicker: {
      marginBottom: 0,
    },
    offlineBanner: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.warn.base + '1A',
      borderRadius: theme.roundness,
      marginBottom: theme.spacing.sm,
    },
    offlineText: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.warn.base,
      textAlign: 'center',
    },
    lastSaved: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
      fontStyle: 'italic',
      marginTop: theme.spacing.sm,
    },
    remarksContainer: {
      marginBottom: theme.spacing.lg,
    },
    submitButton: {
      marginTop: theme.spacing.md,
    },
  });

