import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '@/utils/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Picker } from '@/components/ui/Picker';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import {
  getPromotionCandidates,
  getTargetClasses,
  individualPromote,
  PromotionCandidate,
} from '@/api/headmaster/promotions';
import { Class } from '@/types/database';
import { GraduationCap, ArrowRight, Repeat, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useKeyboardAvoidance } from '@/hooks/useKeyboardAvoidance';

type PromotionStatus = 'promoted' | 'repeated' | 'graduated';

export default function IndividualPromotionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const keyboardAvoidance = useKeyboardAvoidance();

  const classId = route.params?.classId;
  const className = route.params?.className || 'Class';
  const currentYear = new Date().getFullYear();
  const defaultAcademicYear = `${currentYear}/${currentYear + 1}`;
  const academicYear = route.params?.academicYear || defaultAcademicYear;

  const [candidates, setCandidates] = useState<PromotionCandidate[]>([]);
  const [targetClasses, setTargetClasses] = useState<Class[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [promotionStatus, setPromotionStatus] = useState<PromotionStatus>('promoted');
  const [selectedTargetClass, setSelectedTargetClass] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (classId) {
      loadData();
    }
  }, [classId, academicYear]);

  const loadData = async () => {
    if (!classId) return;

    setLoading(true);
    try {
      const [candidatesRes, targetClassesRes] = await Promise.all([
        getPromotionCandidates(classId, academicYear),
        user?.school_id ? getTargetClasses(user.school_id, 0) : Promise.resolve({ data: [], error: null }),
      ]);

      if (candidatesRes.error) throw candidatesRes.error;
      if (targetClassesRes.error) throw targetClassesRes.error;

      setCandidates(candidatesRes.data || []);
      setTargetClasses(targetClassesRes.data || []);
    } catch (err: any) {
      console.error('[IndividualPromotionScreen] Error loading data:', err);
      showToast(err?.message || 'Failed to load promotion data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = () => {
    if (!selectedStudent || !user?.id) {
      showToast('Please select a student', 'warning');
      return;
    }

    if (promotionStatus === 'promoted' && !selectedTargetClass) {
      showToast('Please select a target class for promotion', 'warning');
      return;
    }

    const student = candidates.find((c) => c.student.id === selectedStudent);
    if (!student) return;

    Alert.alert(
      'Confirm Promotion',
      `Are you sure you want to ${promotionStatus === 'promoted' ? 'promote' : promotionStatus === 'repeated' ? 'repeat' : 'graduate'} ${student.student.first_name} ${student.student.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setSubmitting(true);
            try {
              const { error } = await individualPromote(
                selectedStudent,
                classId,
                promotionStatus === 'promoted' ? selectedTargetClass : null,
                academicYear,
                promotionStatus,
                user.id,
                notes || undefined
              );

              if (error) throw error;

              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('Student promotion processed successfully', 'success');
              
              // Reset form
              setSelectedStudent('');
              setPromotionStatus('promoted');
              setSelectedTargetClass('');
              setNotes('');
              
              // Reload data
              await loadData();
            } catch (err: any) {
              console.error('[IndividualPromotionScreen] Error promoting:', err);
              showToast(err?.message || 'Failed to process promotion', 'error');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return <Loader />;

  const selectedStudentData = candidates.find((c) => c.student.id === selectedStudent);

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
        {/* Student Selection */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Select Student</Text>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Student *</Text>
            <Picker
              value={selectedStudent}
              onValueChange={setSelectedStudent}
              options={candidates.map((c) => ({
                label: `${c.student.first_name} ${c.student.last_name} (${c.student.admission_number})`,
                value: c.student.id,
              }))}
              style={styles.picker}
            />
          </View>

          {selectedStudentData && (
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>
                {selectedStudentData.student.first_name} {selectedStudentData.student.last_name}
              </Text>
              <Text style={styles.admissionNumber}>
                Admission: {selectedStudentData.student.admission_number}
              </Text>
              {selectedStudentData.averageScore !== undefined && (
                <Text style={styles.averageScore}>
                  Average Score: {selectedStudentData.averageScore.toFixed(1)}%
                </Text>
              )}
            </View>
          )}
        </Card>

        {/* Promotion Status */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Promotion Status</Text>
          <View style={styles.statusOptions}>
            <Pressable
              onPress={() => {
                setPromotionStatus('promoted');
                setSelectedTargetClass('');
              }}
              style={[
                styles.statusOption,
                promotionStatus === 'promoted' && styles.statusOptionActive,
              ]}
            >
              <GraduationCap
                size={24}
                color={promotionStatus === 'promoted' ? theme.colors.primary.base : theme.colors.text.secondary}
              />
              <Text
                style={[
                  styles.statusOptionText,
                  promotionStatus === 'promoted' && styles.statusOptionTextActive,
                ]}
              >
                Promote
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setPromotionStatus('repeated');
                setSelectedTargetClass('');
              }}
              style={[
                styles.statusOption,
                promotionStatus === 'repeated' && styles.statusOptionActive,
              ]}
            >
              <Repeat
                size={24}
                color={promotionStatus === 'repeated' ? theme.colors.warn.base : theme.colors.text.secondary}
              />
              <Text
                style={[
                  styles.statusOptionText,
                  promotionStatus === 'repeated' && styles.statusOptionTextActive,
                ]}
              >
                Repeat
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setPromotionStatus('graduated');
                setSelectedTargetClass('');
              }}
              style={[
                styles.statusOption,
                promotionStatus === 'graduated' && styles.statusOptionActive,
              ]}
            >
              <CheckCircle
                size={24}
                color={promotionStatus === 'graduated' ? theme.colors.success[500] : theme.colors.text.secondary}
              />
              <Text
                style={[
                  styles.statusOptionText,
                  promotionStatus === 'graduated' && styles.statusOptionTextActive,
                ]}
              >
                Graduate
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* Target Class (only for promotion) 0503304746*/}
        {promotionStatus === 'promoted' && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Target Class</Text>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Target Class *</Text>
              <Picker
                value={selectedTargetClass}
                onValueChange={setSelectedTargetClass}
                options={targetClasses.map((c) => ({
                  label: `${c.name} (Level ${c.level})`,
                  value: c.id,
                }))}
                style={styles.picker}
              />
            </View>
          </Card>
        )}

        {/* Notes */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Notes (Optional)</Text>
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any additional notes..."
            multiline
            numberOfLines={4}
            style={styles.notesInput}
          />
        </Card>

        {/* Submit Button */}
        <Button
          title={
            promotionStatus === 'promoted'
              ? 'Promote Student'
              : promotionStatus === 'repeated'
              ? 'Repeat Student'
              : 'Graduate Student'
          }
          onPress={handlePromote}
          loading={submitting}
          disabled={!selectedStudent || (promotionStatus === 'promoted' && !selectedTargetClass)}
          icon={
            promotionStatus === 'promoted' ? (
              <ArrowRight size={18} color={theme.colors.text.inverse} />
            ) : (
              <CheckCircle size={18} color={theme.colors.text.inverse} />
            )
          }
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
    card: {
      marginBottom: theme.spacing.md,
      padding: theme.spacing.lg,
    },
    cardTitle: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    pickerContainer: {
      marginBottom: theme.spacing.md,
    },
    pickerLabel: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
    },
    picker: {
      marginBottom: 0,
    },
    studentInfo: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.roundness,
    },
    studentName: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 2,
    },
    admissionNumber: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs / 2,
    },
    averageScore: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    statusOptions: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    statusOption: {
      flex: 1,
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.roundness,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    statusOptionActive: {
      borderColor: theme.colors.primary.base,
      backgroundColor: theme.colors.primary.base + '1A',
    },
    statusOptionText: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs,
      fontWeight: theme.typography.fontWeights.medium,
    },
    statusOptionTextActive: {
      color: theme.colors.text.primary,
      fontWeight: theme.typography.fontWeights.semibold,
    },
    notesInput: {
      marginBottom: 0,
      minHeight: 100,
    },
    submitButton: {
      marginTop: theme.spacing.md,
    },
  });

