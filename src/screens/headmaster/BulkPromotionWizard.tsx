import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '@/utils/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Picker } from '@/components/ui/Picker';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import {
  getPromotionCandidates,
  getTargetClasses,
  bulkPromote,
  PromotionCandidate,
  BulkPromotionRequest,
} from '@/api/headmaster/promotions';
import { Class } from '@/types/database';
import { CheckCircle, X, ArrowRight, Users, GraduationCap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

type WizardStep = 'select' | 'preview' | 'confirm';

export default function BulkPromotionWizard() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const classId = route.params?.classId;
  const className = route.params?.className || 'Class';
  const currentYear = new Date().getFullYear();
  const defaultAcademicYear = `${currentYear}/${currentYear + 1}`;
  const academicYear = route.params?.academicYear || defaultAcademicYear;

  const [step, setStep] = useState<WizardStep>('select');
  const [candidates, setCandidates] = useState<PromotionCandidate[]>([]);
  const [targetClasses, setTargetClasses] = useState<Class[]>([]);
  const [selectedTargetClass, setSelectedTargetClass] = useState<string>('');
  const [excludedStudents, setExcludedStudents] = useState<Set<string>>(new Set());
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
      console.error('[BulkPromotionWizard] Error loading data:', err);
      showToast(err?.message || 'Failed to load promotion data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExclude = (studentId: string) => {
    setExcludedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleNext = () => {
    if (step === 'select') {
      if (!selectedTargetClass) {
        showToast('Please select a target class', 'warning');
        return;
      }
      setStep('preview');
    } else if (step === 'preview') {
      setStep('confirm');
    }
  };

  const handleBack = () => {
    if (step === 'preview') {
      setStep('select');
    } else if (step === 'confirm') {
      setStep('preview');
    }
  };

  const handleConfirm = () => {
    Alert.alert(
      'Confirm Bulk Promotion',
      `Are you sure you want to promote ${candidates.length - excludedStudents.size} students from ${className}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;

            setSubmitting(true);
            try {
              const request: BulkPromotionRequest = {
                classId,
                academicYear,
                excludeStudentIds: Array.from(excludedStudents),
                targetClassId: selectedTargetClass || undefined,
              };

              const { error } = await bulkPromote(request, user.id);
              if (error) throw error;

              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('Students promoted successfully', 'success');
              navigation.goBack();
            } catch (err: any) {
              console.error('[BulkPromotionWizard] Error promoting:', err);
              showToast(err?.message || 'Failed to promote students', 'error');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return <Loader />;

  const studentsToPromote = candidates.filter((c) => !excludedStudents.has(c.student.id));
  const studentsToExclude = candidates.filter((c) => excludedStudents.has(c.student.id));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        <View style={[styles.step, step === 'select' && styles.stepActive]}>
          <Text style={[styles.stepNumber, step === 'select' && styles.stepNumberActive]}>1</Text>
          <Text style={[styles.stepLabel, step === 'select' && styles.stepLabelActive]}>Select</Text>
        </View>
        <View style={[styles.stepLine, step !== 'select' && styles.stepLineActive]} />
        <View style={[styles.step, step === 'preview' && styles.stepActive]}>
          <Text style={[styles.stepNumber, step === 'preview' && styles.stepNumberActive]}>2</Text>
          <Text style={[styles.stepLabel, step === 'preview' && styles.stepLabelActive]}>Preview</Text>
        </View>
        <View style={[styles.stepLine, step === 'confirm' && styles.stepLineActive]} />
        <View style={[styles.step, step === 'confirm' && styles.stepActive]}>
          <Text style={[styles.stepNumber, step === 'confirm' && styles.stepNumberActive]}>3</Text>
          <Text style={[styles.stepLabel, step === 'confirm' && styles.stepLabelActive]}>Confirm</Text>
        </View>
      </View>

      {/* Step 1: Select Target Class */}
      {step === 'select' && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>Select Target Class</Text>
          <Text style={styles.stepSubtitle}>
            Choose the class to promote students to
          </Text>

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

          <Button
            title="Next: Preview"
            onPress={handleNext}
            disabled={!selectedTargetClass}
            icon={<ArrowRight size={18} color={theme.colors.text.inverse} />}
            style={styles.nextButton}
          />
        </Card>
      )}

      {/* Step 2: Preview & Exclude */}
      {step === 'preview' && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>Preview & Exclude Students</Text>
          <Text style={styles.stepSubtitle}>
            Review students and exclude any that should not be promoted
          </Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Users size={20} color={theme.colors.primary.base} />
              <Text style={styles.summaryValue}>{studentsToPromote.length}</Text>
              <Text style={styles.summaryLabel}>To Promote</Text>
            </View>
            <View style={styles.summaryItem}>
              <X size={20} color={theme.colors.error.base} />
              <Text style={styles.summaryValue}>{studentsToExclude.length}</Text>
              <Text style={styles.summaryLabel}>Excluded</Text>
            </View>
          </View>

          <View style={styles.studentsList}>
            {candidates.map((candidate) => {
              const isExcluded = excludedStudents.has(candidate.student.id);
              return (
                <Card key={candidate.student.id} style={styles.studentCard}>
                  <View style={styles.studentRow}>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>
                        {candidate.student.first_name} {candidate.student.last_name}
                      </Text>
                      <Text style={styles.admissionNumber}>
                        {candidate.student.admission_number}
                      </Text>
                      {candidate.averageScore !== undefined && (
                        <Text style={styles.averageScore}>
                          Average: {candidate.averageScore.toFixed(1)}%
                        </Text>
                      )}
                    </View>
                    <Switch
                      value={!isExcluded}
                      onValueChange={() => handleToggleExclude(candidate.student.id)}
                      trackColor={{
                        false: theme.colors.surface.secondary,
                        true: theme.colors.primary.base + '80',
                      }}
                      thumbColor={isExcluded ? theme.colors.error.base : theme.colors.primary.base}
                    />
                  </View>
                </Card>
              );
            })}
          </View>

          <View style={styles.stepActions}>
            <Button
              title="Back"
              onPress={handleBack}
              variant="outline"
              style={styles.backButton}
            />
            <Button
              title="Next: Confirm"
              onPress={handleNext}
              icon={<ArrowRight size={18} color={theme.colors.text.inverse} />}
              style={styles.nextButton}
            />
          </View>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>Confirm Promotion</Text>
          <Text style={styles.stepSubtitle}>
            Review the promotion details before confirming
          </Text>

          <View style={styles.confirmDetails}>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>From Class:</Text>
              <Text style={styles.confirmValue}>{className}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>To Class:</Text>
              <Text style={styles.confirmValue}>
                {targetClasses.find((c) => c.id === selectedTargetClass)?.name || 'N/A'}
              </Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Students to Promote:</Text>
              <Text style={styles.confirmValue}>{studentsToPromote.length}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Students Excluded:</Text>
              <Text style={styles.confirmValue}>{studentsToExclude.length}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Academic Year:</Text>
              <Text style={styles.confirmValue}>{academicYear}</Text>
            </View>
          </View>

          <View style={styles.stepActions}>
            <Button
              title="Back"
              onPress={handleBack}
              variant="outline"
              style={styles.backButton}
            />
            <Button
              title="Confirm Promotion"
              onPress={handleConfirm}
              loading={submitting}
              icon={<CheckCircle size={18} color={theme.colors.text.inverse} />}
              style={styles.confirmButton}
            />
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    content: {
      padding: theme.spacing.lg,
    },
    stepIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
    },
    step: {
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    stepActive: {
      opacity: 1,
    },
    stepNumber: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.surface.secondary,
      color: theme.colors.text.secondary,
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.bold,
      textAlign: 'center',
      lineHeight: 32,
    },
    stepNumberActive: {
      backgroundColor: theme.colors.primary.base,
      color: theme.colors.text.inverse,
    },
    stepLabel: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
    },
    stepLabelActive: {
      color: theme.colors.primary.base,
      fontWeight: theme.typography.fontWeights.semibold,
    },
    stepLine: {
      width: 40,
      height: 2,
      backgroundColor: theme.colors.surface.secondary,
      marginHorizontal: theme.spacing.sm,
    },
    stepLineActive: {
      backgroundColor: theme.colors.primary.base,
    },
    stepCard: {
      padding: theme.spacing.lg,
    },
    stepTitle: {
      fontSize: theme.typography.fontSizes.xl,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    stepSubtitle: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.lg,
    },
    pickerContainer: {
      marginBottom: theme.spacing.lg,
    },
    pickerLabel: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
    },
    picker: {
      marginBottom: 0,
    },
    nextButton: {
      marginTop: theme.spacing.md,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.roundness,
    },
    summaryValue: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginTop: theme.spacing.xs,
    },
    summaryLabel: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs / 2,
    },
    studentsList: {
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    studentCard: {
      padding: theme.spacing.md,
    },
    studentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    studentInfo: {
      flex: 1,
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
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.muted,
    },
    stepActions: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.md,
    },
    backButton: {
      flex: 1,
    },
    confirmButton: {
      flex: 1,
    },
    confirmDetails: {
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.roundness,
    },
    confirmRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    confirmLabel: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.secondary,
    },
    confirmValue: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
  });

