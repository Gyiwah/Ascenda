import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
  Pressable,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/utils/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import {
  getAssessmentsForReview,
  updateAssessment,
  approveAssessment,
  lockTermResults,
  AssessmentWithDetails,
} from '@/api/headmaster/approvals';
import { GradeBadge } from '@/components/teacher/GradeBadge';
// Removed computeGrade import - using configurable grades only
import { CheckCircle, Lock, Edit, ChevronDown, ChevronUp, X, History } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useKeyboardAvoidance } from '@/hooks/useKeyboardAvoidance';
import { supabase } from '@/database/client';
import { AuditLog } from '@/types/database';
import { DEFAULT_FAIL_LABEL } from '@/constants/grades';

interface EditableScore {
  assessmentId: string;
  caScore: string;
  examScore: string;
  totalScore: number;
  grade: string;
}

type GradeBandConfig = {
  min: number;
  max: number;
  label: string;
};

export default function ReviewAssessmentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const keyboardAvoidance = useKeyboardAvoidance();

  const classId = route.params?.classId;
  const subjectId = route.params?.subjectId;
  const className = route.params?.className || 'Class';
  const subjectName = route.params?.subjectName || 'Subject';
  const currentYear = new Date().getFullYear();
  const defaultAcademicYear = `${currentYear}/${currentYear + 1}`;
  const academicYear = route.params?.academicYear || defaultAcademicYear;
  const term = route.params?.term || 1;
  const isLocked = route.params?.isLocked || false;
  const isApproved = route.params?.isApproved || false;

  const [assessments, setAssessments] = useState<AssessmentWithDetails[]>([]);
  const [editableScores, setEditableScores] = useState<Record<string, EditableScore>>({});
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [gradeBands, setGradeBands] = useState<GradeBandConfig[] | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (classId && subjectId) {
        loadData();
      }
    }, [classId, subjectId, academicYear, term])
  );

  const loadData = async () => {
    if (!classId || !subjectId) return;

    setLoading(true);
    try {
      // Load assessments
      const { data, error } = await getAssessmentsForReview(
        classId,
        subjectId,
        academicYear,
        term
      );

      if (error) throw error;

      setAssessments(data || []);

      // Initialize editable scores
      const initialScores: Record<string, EditableScore> = {};
      (data || []).forEach((assessment) => {
        initialScores[assessment.id] = {
          assessmentId: assessment.id,
          caScore: assessment.ca_score?.toString() || '0',
          examScore: assessment.exam_score?.toString() || '0',
          totalScore: assessment.total_score || 0,
          grade: assessment.grade || DEFAULT_FAIL_LABEL,
        };
      });
      setEditableScores(initialScores);

      // Load grade configuration for the headmaster's school
      if (user?.school_id) {
        try {
          const { schoolService } = await import('@/api/schools');
          const { data: school, error: schoolError } = await schoolService.getById(user.school_id);
          if (!schoolError && school) {
            const config = (school as any).assessment_grade_config;
            if (Array.isArray(config)) {
              setGradeBands(
                config.map((band: any) => ({
                  min: Number(band.min) || 0,
                  max: Number(band.max) || 0,
                  label: String(band.label ?? ''),
                }))
              );
            } else {
              setGradeBands(null);
            }
          } else {
            setGradeBands(null);
          }
        } catch (e) {
          console.warn('[ReviewAssessmentScreen] Failed to load grade config', e);
          setGradeBands(null);
        }
      }
    } catch (err: any) {
      console.error('[ReviewAssessmentScreen] Error loading data:', err);
      showToast('Failed to load assessments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditTrail = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('table_name', 'assessments')
        .or(`record_id.in.(${assessments.map(a => a.id).join(',')}),record_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (err: any) {
      console.error('[ReviewAssessmentScreen] Error loading audit trail:', err);
    }
  };

  // Default grade bands (WAEC-style) - used if school hasn't configured custom bands
  const DEFAULT_GRADE_BANDS: GradeBandConfig[] = [
    { min: 80, max: 100, label: '1' },
    { min: 70, max: 79, label: '2' },
    { min: 65, max: 69, label: '3' },
    { min: 60, max: 64, label: '4' },
    { min: 55, max: 59, label: '5' },
    { min: 50, max: 54, label: '6' },
    { min: 45, max: 49, label: '7' },
    { min: 40, max: 44, label: '8' },
    { min: 0, max: 39, label: '9' },
  ];

  const getLetterGrade = (total: number): string => {
    // Use configured grade bands if available, otherwise use default
    const bands = gradeBands && gradeBands.length > 0 ? gradeBands : DEFAULT_GRADE_BANDS;
  const band = bands.find((b) => total >= b.min && total <= b.max);
  return band ? band.label : DEFAULT_FAIL_LABEL; // Fallback to centralized default
  };

  const handleScoreChange = (assessmentId: string, type: 'ca' | 'exam', value: string) => {
    if (isLocked) return;

    setEditableScores((prev) => {
      const current = prev[assessmentId] || {
        assessmentId,
        caScore: '0',
        examScore: '0',
        totalScore: 0,
  grade: DEFAULT_FAIL_LABEL,
      };

      const updatedCa = type === 'ca' ? value : current.caScore;
      const updatedExam = type === 'exam' ? value : current.examScore;

      const caNum = parseFloat(updatedCa) || 0;
      const examNum = parseFloat(updatedExam) || 0;
      const total = caNum + examNum;
      const grade = getLetterGrade(total);

      return {
        ...prev,
        [assessmentId]: {
          assessmentId,
          caScore: updatedCa,
          examScore: updatedExam,
          totalScore: total,
          grade,
        },
      };
    });
  };

  const handleSaveScore = async (assessmentId: string) => {
    if (!user?.id || isLocked) return;

    const score = editableScores[assessmentId];
    if (!score) return;

    setSubmitting(true);
    try {
      const { error } = await updateAssessment(
        assessmentId,
        {
          ca_score: parseFloat(score.caScore) || 0,
          exam_score: parseFloat(score.examScore) || 0,
        },
        user.id
      );

      if (error) throw error;

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Score updated successfully', 'success');
      await loadData();
    } catch (err: any) {
      console.error('[ReviewAssessmentScreen] Error updating score:', err);
      showToast(err?.message || 'Failed to update score', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve Assessments',
      `Are you sure you want to approve all assessments for ${className} - ${subjectName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            if (!user?.id) return;

            setSubmitting(true);
            try {
              const { error } = await approveAssessment(
                classId,
                subjectId,
                academicYear,
                term,
                user.id
              );

              if (error) throw error;

              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('Assessments approved successfully', 'success');
              
              // Small delay to ensure database update is committed
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Reload data before going back to ensure UI is updated
              await loadData();
              
              // Navigate back - the ApprovalsDashboard will refresh on focus
              navigation.goBack();
            } catch (err: any) {
              console.error('[ReviewAssessmentScreen] Error approving:', err);
              showToast(err?.message || 'Failed to approve assessments', 'error');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleLock = () => {
    Alert.alert(
      'Lock Term Results',
      `Are you sure you want to lock Term ${term} results for ${className}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Lock',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;

            setSubmitting(true);
            try {
              // Lock only the current subject's assessments
              const { error } = await lockTermResults(classId, academicYear, term, user.id, subjectId);

              if (error) throw error;

              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('Term results locked successfully', 'success');
              navigation.goBack();
            } catch (err: any) {
              console.error('[ReviewAssessmentScreen] Error locking:', err);
              showToast(err?.message || 'Failed to lock results', 'error');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  if (loading) return <Loader />;

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
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.className}>{className}</Text>
              <Text style={styles.subjectName}>{subjectName}</Text>
              <Text style={styles.metaText}>
                Term {term} • {academicYear}
              </Text>
            </View>
            <View style={styles.badgesContainer}>
              {isApproved && (
                <View style={styles.approvedBadge}>
                    <CheckCircle size={16} color={theme.colors.success[500]} />
                  <Text style={styles.approvedText}>Approved</Text>
                </View>
              )}
              {isLocked && (
                <View style={styles.lockedBadge}>
                  <Lock size={16} color={theme.colors.warn.base} />
                  <Text style={styles.lockedText}>Locked</Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Summary Card */}
        {assessments.length > 0 && (
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Students</Text>
                <Text style={styles.summaryValue}>{assessments.length}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Average Score</Text>
                <Text style={styles.summaryValue}>
                  {(
                    assessments.reduce((sum, a) => sum + (a.total_score || 0), 0) /
                    assessments.length
                  ).toFixed(1)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Approved</Text>
                <Text style={styles.summaryValue}>
                  {assessments.filter((a) => a.approved_at).length}
                </Text>
              </View>
            </View>

            {gradeBands && gradeBands.length > 0 && (
              <View style={styles.gradeLegend}>
                <Text style={styles.gradeLegendTitle}>Grade Bands</Text>
                <View style={styles.gradeLegendList}>
                  {gradeBands.map((band, index) => (
                    <View key={`${band.label}-${index}`} style={styles.gradeLegendItem}>
                      <Text style={styles.gradeLegendLabel}>{band.label}</Text>
                      <Text style={styles.gradeLegendRange}>
                        {band.min.toFixed(0)} - {band.max.toFixed(0)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Students List */}
        <View style={styles.studentsList}>
          {assessments.map((assessment) => {
            const score = editableScores[assessment.id] || {
              assessmentId: assessment.id,
              caScore: assessment.ca_score?.toString() || '0',
              examScore: assessment.exam_score?.toString() || '0',
              totalScore: assessment.total_score || 0,
              grade: assessment.grade || DEFAULT_FAIL_LABEL,
            };
            const isExpanded = expandedStudents.has(assessment.student_id);
            const hasChanges =
              parseFloat(score.caScore) !== assessment.ca_score ||
              parseFloat(score.examScore) !== assessment.exam_score;

            return (
              <Card key={assessment.id} style={styles.studentCard}>
                <Pressable
                  onPress={() => toggleStudentExpansion(assessment.student_id)}
                  style={styles.studentHeader}
                >
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>
                      {assessment.student?.first_name} {assessment.student?.last_name}
                    </Text>
                    <Text style={styles.admissionNumber}>
                      {assessment.student?.admission_number}
                    </Text>
                  </View>
                  <View style={styles.scoreSummary}>
                    <Text style={styles.totalScore}>{score.totalScore.toFixed(1)}</Text>
                    <GradeBadge grade={score.grade} size="sm" />
                    {isExpanded ? (
                      <ChevronUp size={20} color={theme.colors.text.secondary} />
                    ) : (
                      <ChevronDown size={20} color={theme.colors.text.secondary} />
                    )}
                  </View>
                </Pressable>

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={styles.scoreInputs}>
                      <View style={styles.scoreInput}>
                        <Text style={styles.scoreLabel}>CA Score</Text>
                        <Input
                          value={score.caScore}
                          onChangeText={(value) => handleScoreChange(assessment.id, 'ca', value)}
                          keyboardType="numeric"
                          editable={!isLocked}
                          style={styles.input}
                        />
                      </View>
                      <View style={styles.scoreInput}>
                        <Text style={styles.scoreLabel}>Exam Score</Text>
                        <Input
                          value={score.examScore}
                          onChangeText={(value) => handleScoreChange(assessment.id, 'exam', value)}
                          keyboardType="numeric"
                          editable={!isLocked}
                          style={styles.input}
                        />
                      </View>
                    </View>

                    {hasChanges && !isLocked && (
                      <Button
                        title="Save Changes"
                        onPress={() => handleSaveScore(assessment.id)}
                        loading={submitting}
                        variant="outline"
                        icon={<Edit size={16} color={theme.colors.primary.base} />}
                        style={styles.saveButton}
                      />
                    )}

                    <View style={styles.metaInfo}>
                      <Text style={styles.metaLabel}>Submitted:</Text>
                      <Text style={styles.metaValue}>
                        {assessment.submitted_at
                          ? new Date(assessment.submitted_at).toLocaleString()
                          : 'Not submitted'}
                      </Text>
                    </View>
                    {assessment.approved_at && (
                      <View style={styles.metaInfo}>
                        <Text style={styles.metaLabel}>Approved:</Text>
                        <Text style={styles.metaValue}>
                          {new Date(assessment.approved_at).toLocaleString()}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </Card>
            );
          })}
        </View>

        {/* Action Buttons */}
        {!isLocked && (
          <View style={styles.actions}>
            {!isApproved && (
              <Button
                title="Approve All"
                onPress={handleApprove}
                loading={submitting}
                icon={<CheckCircle size={18} color={theme.colors.text.inverse} />}
                style={styles.actionButton}
              />
            )}
            {isApproved && (
              <Button
                title="Lock Term Results"
                onPress={handleLock}
                loading={submitting}
                variant="outline"
                icon={<Lock size={18} color={theme.colors.warn.base} />}
                style={styles.actionButton}
              />
            )}
            <Button
              title="Audit Trail"
              onPress={() => {
                loadAuditTrail();
                setShowAuditTrail(true);
              }}
              variant="outline"
              icon={<History size={18} color={theme.colors.accent.base} />}
              style={styles.actionButton}
            />
          </View>
        )}
      </ScrollView>

      {/* Audit Trail Modal */}
      <Modal
        visible={showAuditTrail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAuditTrail(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Audit Trail</Text>
            <Pressable onPress={() => setShowAuditTrail(false)} style={styles.closeButton}>
              <X size={24} color={theme.colors.text.primary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            {auditLogs.length === 0 ? (
              <Text style={styles.emptyText}>No audit logs found</Text>
            ) : (
              auditLogs.map((log) => (
                <Card key={log.id} style={styles.auditCard}>
                  <View style={styles.auditHeader}>
                    <Text style={styles.auditAction}>{log.action}</Text>
                    <Text style={styles.auditDate}>
                      {new Date(log.created_at).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.auditTable}>{log.table_name}</Text>
                  {log.old_data && (
                    <View style={styles.auditData}>
                      <Text style={styles.auditDataLabel}>Old Data:</Text>
                      <Text style={styles.auditDataText}>
                        {JSON.stringify(log.old_data, null, 2)}
                      </Text>
                    </View>
                  )}
                  {log.new_data && (
                    <View style={styles.auditData}>
                      <Text style={styles.auditDataLabel}>New Data:</Text>
                      <Text style={styles.auditDataText}>
                        {JSON.stringify(log.new_data, null, 2)}
                      </Text>
                    </View>
                  )}
                </Card>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
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
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    className: {
      fontSize: theme.typography.fontSizes.xl,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 2,
    },
    subjectName: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs / 2,
    },
    metaText: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    badgesContainer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      alignItems: 'center',
    },
    approvedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs / 2,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      backgroundColor: theme.colors.success[500] + '1A',
      borderRadius: theme.roundness,
    },
    approvedText: {
      fontSize: theme.typography.fontSizes.xs,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.success[500],
    },
    lockedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs / 2,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      backgroundColor: theme.colors.warn.base + '1A',
      borderRadius: theme.roundness,
    },
    lockedText: {
      fontSize: theme.typography.fontSizes.xs,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.warn.base,
    },
    summaryCard: {
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.md,
    },
    summaryTitle: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    summaryItem: {
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs / 2,
    },
    summaryValue: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.primary.base,
    },
    gradeLegend: {
      marginTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
      paddingTop: theme.spacing.md,
    },
    gradeLegendTitle: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    gradeLegendList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    gradeLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs / 2,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs / 2,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface.secondary,
    },
    gradeLegendLabel: {
      fontSize: theme.typography.fontSizes.xs,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    gradeLegendRange: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
    },
    studentsList: {
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    studentCard: {
      padding: theme.spacing.md,
    },
    studentHeader: {
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
    },
    scoreSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    totalScore: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
    },
    expandedContent: {
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
    },
    scoreInputs: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    scoreInput: {
      flex: 1,
    },
    scoreLabel: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
    },
    input: {
      marginBottom: 0,
    },
    saveButton: {
      marginTop: theme.spacing.sm,
    },
    metaInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.xs,
    },
    metaLabel: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    metaValue: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.primary,
    },
    actions: {
      gap: theme.spacing.md,
      marginTop: theme.spacing.md,
    },
    actionButton: {
      width: '100%',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
      backgroundColor: theme.colors.surface.primary,
    },
    modalTitle: {
      fontSize: theme.typography.fontSizes.xl,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
    },
    closeButton: {
      padding: theme.spacing.xs,
    },
    modalContent: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    emptyText: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginTop: theme.spacing.xl,
    },
    auditCard: {
      marginBottom: theme.spacing.md,
      padding: theme.spacing.md,
    },
    auditHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    auditAction: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.primary.base,
    },
    auditDate: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    auditTable: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.sm,
    },
    auditData: {
      marginTop: theme.spacing.sm,
    },
    auditDataLabel: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 2,
    },
    auditDataText: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
      fontFamily: 'monospace',
    },
  });

