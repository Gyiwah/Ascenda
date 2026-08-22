import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Alert, Pressable, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '@/utils/useAuth';
import { getStudentsForClass } from '@/api/teacher/students';
import { getAssessmentsForClass, saveAssessmentDraft, submitAssessment, AssessmentDraft } from '@/api/teacher/assessments';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Picker } from '@/components/ui/Picker';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { ScoreInputRow } from '@/components/teacher/ScoreInputRow';
import { Student } from '@/types/database';
// Removed computeGrade import - using configurable grades only
import { DEFAULT_FAIL_LABEL } from '@/constants/grades';
import { validateAssessmentSubmission } from '@/utils/validators';
import { CheckCircle, Save, Send, ChevronLeft, ChevronRight, Eye, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useKeyboardAvoidance } from '@/hooks/useKeyboardAvoidance';
import { GradeBadge } from '@/components/teacher/GradeBadge';

interface ScoreData {
  studentId: string;
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

export default function StudentScoreEntryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isOnline } = useNetworkStatus();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const scrollViewRef = useRef<ScrollView>(null);
  const keyboardAvoidance = useKeyboardAvoidance();

  const classId = route.params?.classId;
  const subjectId = route.params?.subjectId;
  const className = route.params?.className || 'Class';
  const subjectName = route.params?.subjectName || 'Subject';

  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreData>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const currentYear = new Date().getFullYear();
  const defaultAcademicYear = `${currentYear}/${currentYear + 1}`;
  const [academicYear, setAcademicYear] = useState<string>(defaultAcademicYear);
  const [term, setTerm] = useState<number>(1);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [caMax, setCaMax] = useState<number>(40);
  const [examMax, setExamMax] = useState<number>(60);
  const [gradeBands, setGradeBands] = useState<GradeBandConfig[] | null>(null);

  useEffect(() => {
    if (classId && user?.school_id) {
      loadData();
      loadSchoolMaxima();
    }
  }, [classId, user?.school_id, academicYear, term]);

  const loadSchoolMaxima = async () => {
    try {
      const { schoolService } = await import('@/api/schools');
      const { data, error } = await schoolService.getById(user!.school_id as string);
      if (error) throw error;
      if (data) {
        setCaMax(Number((data as any).assessment_ca_max) || 40);
        setExamMax(Number((data as any).assessment_exam_max) || 60);
        const config = (data as any).assessment_grade_config;
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
      }
    } catch (err) {
      setCaMax(40);
      setExamMax(60);
      setGradeBands(null);
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
    
    if (bands.length === 0) {
  return DEFAULT_FAIL_LABEL;
    }
    
    // Grade bands are configured for percentage scale (0-100)
    // total_score is the raw sum of CA + Exam
    // We need to normalize it to percentage if the max total is not 100
    const totalMax = Math.max(1, caMax + examMax);
    const percentage = (total / totalMax) * 100;

    // Normalize and sanitize bands
    const normalized = bands
      .map((b) => ({ min: Number(b.min) || 0, max: Number(b.max) || 0, label: String(b.label || '').trim() }))
      .filter((b) => b.label && !Number.isNaN(b.min) && !Number.isNaN(b.max));

  if (normalized.length === 0) return DEFAULT_FAIL_LABEL;

    // Sort bands by min descending so higher bands match first
    const sortedBands = normalized.sort((a, b) => b.min - a.min);

    for (const band of sortedBands) {
      // inclusive min/max
      if (percentage >= band.min && percentage <= band.max) {
        return band.label;
      }
    }

    // If nothing matched, return the label of the band with the lowest min
    const lowest = sortedBands[sortedBands.length - 1];
  return lowest ? lowest.label : DEFAULT_FAIL_LABEL;
  };

  const loadData = async () => {
    if (!classId || !user?.school_id) return;

    setLoading(true);
    try {
      // Load students
      const { data: studentsData, error: studentsError } = await getStudentsForClass(classId, user.school_id);
      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Load existing assessments
      const { data: assessments, error: assessmentsError } = await getAssessmentsForClass(
        classId,
        subjectId,
        academicYear,
        term
      );

      if (assessmentsError) {
        console.warn('[StudentScoreEntryScreen] Error loading assessments:', assessmentsError);
      }

      // Initialize scores from existing assessments or empty
      const initialScores: Record<string, ScoreData> = {};
      (studentsData || []).forEach((student) => {
        const existing = assessments?.find((a) => a.student_id === student.id);
        initialScores[student.id] = {
          studentId: student.id,
          caScore: existing?.ca_score?.toString() || '',
          examScore: existing?.exam_score?.toString() || '',
          totalScore: existing?.total_score || 0,
          grade: existing?.grade || '',
        };
      });

      setScores(initialScores);
      setIsSubmitted(assessments?.[0]?.submitted_at ? true : false);
      setCurrentStudentIndex(0);
    } catch (err: any) {
      console.error('[StudentScoreEntryScreen] Error loading data:', err);
      showToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCAScoreChange = (studentId: string, value: string) => {
    setScores((prev) => {
      const updated = { ...prev };
      if (!updated[studentId]) {
        updated[studentId] = { studentId, caScore: '', examScore: '', totalScore: 0, grade: '' };
      }
      updated[studentId].caScore = value;
      const ca = parseFloat(value) || 0;
      const exam = parseFloat(updated[studentId].examScore) || 0;
      updated[studentId].totalScore = ca + exam;
      updated[studentId].grade =
        updated[studentId].totalScore > 0 ? getLetterGrade(updated[studentId].totalScore) : '';
      return updated;
    });
  };

  const handleExamScoreChange = (studentId: string, value: string) => {
    setScores((prev) => {
      const updated = { ...prev };
      if (!updated[studentId]) {
        updated[studentId] = { studentId, caScore: '', examScore: '', totalScore: 0, grade: '' };
      }
      updated[studentId].examScore = value;
      const ca = parseFloat(updated[studentId].caScore) || 0;
      const exam = parseFloat(value) || 0;
      updated[studentId].totalScore = ca + exam;
      updated[studentId].grade =
        updated[studentId].totalScore > 0 ? getLetterGrade(updated[studentId].totalScore) : '';
      return updated;
    });
  };

  const handlePrevious = () => {
    if (currentStudentIndex > 0) {
      setCurrentStudentIndex(currentStudentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentStudentIndex < students.length - 1) {
      setCurrentStudentIndex(currentStudentIndex + 1);
    }
  };

  const handleSaveDraft = async () => {
    if (!user?.id || !classId || !subjectId) return;

    setSubmitting(true);
    try {
      const assessments: AssessmentDraft[] = students.map((student) => {
        const score = scores[student.id] || { caScore: '', examScore: '', totalScore: 0, grade: '' };
        const caRaw = parseFloat(score.caScore) || 0;
        const examRaw = parseFloat(score.examScore) || 0;
        const ca = Math.max(0, Math.min(caMax, caRaw));
        const exam = Math.max(0, Math.min(examMax, examRaw));
        const total = ca + exam;
        return {
          student_id: student.id,
          subject_id: subjectId,
          class_id: classId,
          academic_year: academicYear,
          term: term,
          ca_score: ca,
          exam_score: exam,
          total_score: total,
          grade: getLetterGrade(total),
          teacher_id: user.id,
        };
      });

      const { error } = await saveAssessmentDraft(assessments);
      if (error) throw error;

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Draft saved successfully', 'success');
    } catch (err: any) {
      console.error('[StudentScoreEntryScreen] Save draft error:', err);
      showToast(err?.message || 'Failed to save draft', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCurrentStudent = async () => {
    if (!user?.id || !classId || !subjectId) return;
    const student = students[currentStudentIndex];
    if (!student) return;

    const score = scores[student.id] || { caScore: '', examScore: '', totalScore: 0, grade: '' };

    // Basic validation/clamping
    const ca = Math.max(0, Math.min(100, parseFloat(score.caScore || '0') || 0));
    const exam = Math.max(0, Math.min(100, parseFloat(score.examScore || '0') || 0));
    const total = ca + exam;

    const draft: AssessmentDraft = {
      student_id: student.id,
      subject_id: subjectId,
      class_id: classId,
      academic_year: academicYear,
      term: term,
      ca_score: ca,
      exam_score: exam,
      total_score: total,
      grade: getLetterGrade(total),
      teacher_id: user.id,
    };

    setSubmitting(true);
    try {
      const { error } = await saveAssessmentDraft([draft]);
      if (error) throw error;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Student draft saved', 'success');
    } catch (err: any) {
      console.error('[StudentScoreEntryScreen] Save current student error:', err);
      showToast(err?.message || 'Failed to save student draft', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id || !classId || !subjectId) return;

    // Validate all scores
    const assessments = students.map((student) => {
        const score = scores[student.id] || { caScore: '', examScore: '', totalScore: 0, grade: '' };
        return {
          ca_score: score.caScore,
          exam_score: score.examScore,
        };
    });

    const validation = validateAssessmentSubmission(assessments);
    if (!validation.valid) {
      showToast(validation.error || 'Please fill all scores', 'warning');
      return;
    }

    Alert.alert(
      'Submit Final Scores',
      'Are you sure you want to submit these scores? You will not be able to edit them after submission.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              const assessmentsToSubmit: AssessmentDraft[] = students.map((student) => {
                const score = scores[student.id] || { caScore: '', examScore: '', totalScore: 0, grade: '' };
                const ca = parseFloat(score.caScore) || 0;
                const exam = parseFloat(score.examScore) || 0;
                const total = ca + exam;
                return {
                  student_id: student.id,
                  subject_id: subjectId,
                  class_id: classId,
                  academic_year: academicYear,
                  term: term,
                  ca_score: ca,
                  exam_score: exam,
                  total_score: total,
                  grade: getLetterGrade(total),
                  teacher_id: user.id,
                };
              });

              const { error } = await submitAssessment(assessmentsToSubmit);
              if (error) throw error;

              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('Scores submitted successfully', 'success');
              setIsSubmitted(true);
              setShowPreview(false);
            } catch (err: any) {
              console.error('[StudentScoreEntryScreen] Submit error:', err);
              showToast(err?.message || 'Failed to submit scores', 'error');
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

  const currentStudent = students[currentStudentIndex];
  const currentScore = currentStudent ? scores[currentStudent.id] || { caScore: '', examScore: '', totalScore: 0, grade: '' } : null;
  const totalStudents = students.length;
  const entriesCount = Object.values(scores || {}).filter(s => s && (s.caScore || s.examScore)).length;
  const progressPercent = totalStudents ? Math.round((entriesCount / totalStudents) * 100) : 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={keyboardAvoidance.behavior}
      keyboardVerticalOffset={keyboardAvoidance.keyboardVerticalOffset}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: keyboardAvoidance.contentPaddingBottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Section */}
        <View style={styles.topHeader}>
          <View style={styles.headerInfo}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.className}>{className}</Text>
                <Text style={styles.subjectName}>{subjectName}</Text>
              </View>
              {isSubmitted && (
                <View style={styles.submittedBadge}>
                  <CheckCircle size={18} color={theme.colors.success[500]} />
                  <Text style={styles.submittedText}>Submitted</Text>
                </View>
              )}
            </View>
            
            <View style={styles.filtersRow}>
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Academic Year</Text>
                  <Picker
                    value={academicYear}
                    onValueChange={(val) => setAcademicYear(val)}
                    options={(() => {
                      const current = new Date().getFullYear();
                      const opts: { label: string; value: string }[] = [];
                      for (let i = 0; i < 3; i++) {
                        const start = current + i;
                        const label = `${start}/${start + 1}`;
                        opts.push({ label, value: label });
                      }
                      return opts;
                    })()}
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
          </View>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressCount}>
                {entriesCount} / {totalStudents}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.progressPercent}>{progressPercent}%</Text>
            </View>
          </View>

          {!isOnline && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineText}>⚠️ Offline — changes saved locally</Text>
            </View>
          )}
        </View>

        {/* Current Student Score Entry Card */}
        {currentStudent && currentScore && (
          <Card style={styles.studentCard}>
            <View style={styles.studentHeader}>
              <View style={styles.studentInfo}>
                <View style={styles.studentNameRow}>
                  <Text style={styles.studentName}>
                    {currentStudent.first_name} {currentStudent.last_name}
                  </Text>
                  <View style={styles.studentIndexBadge}>
                    <Text style={styles.studentIndexText}>
                      {currentStudentIndex + 1} / {totalStudents}
                    </Text>
                  </View>
                </View>
                <Text style={styles.admissionNumber}>{currentStudent.admission_number}</Text>
              </View>
            </View>

            <View style={styles.scoreEntrySection}>
              <ScoreInputRow
                student={currentStudent}
                caScore={currentScore.caScore}
                examScore={currentScore.examScore}
                totalScore={currentScore.totalScore}
                grade={currentScore.grade}
                onCAScoreChange={(value) => handleCAScoreChange(currentStudent.id, value)}
                onExamScoreChange={(value) => handleExamScoreChange(currentStudent.id, value)}
                disabled={isSubmitted}
                caMax={caMax}
                examMax={examMax}
                onCAScoreBlur={(value) => {
                  const ca = Math.max(0, Math.min(caMax, parseFloat(value || '0') || 0));
                  const total = ca + (parseFloat(scores[currentStudent.id]?.examScore || '0') || 0);
                  setScores((prev) => ({
                    ...prev,
                    [currentStudent.id]: {
                      ...(prev[currentStudent.id] || { studentId: currentStudent.id, caScore: '', examScore: '', totalScore: 0, grade: '' }),
                      caScore: ca.toString(),
                      totalScore: total,
                      grade: getLetterGrade(total),
                    },
                  }));
                }}
                onExamScoreBlur={(value) => {
                  const exam = Math.max(0, Math.min(examMax, parseFloat(value || '0') || 0));
                  const total = exam + (parseFloat(scores[currentStudent.id]?.caScore || '0') || 0);
                  setScores((prev) => ({
                    ...prev,
                    [currentStudent.id]: {
                      ...(prev[currentStudent.id] || { studentId: currentStudent.id, caScore: '', examScore: '', totalScore: 0, grade: '' }),
                      examScore: exam.toString(),
                      totalScore: total,
                      grade: getLetterGrade(total),
                    },
                  }));
                }}
              />
            </View>

            {/* Validation Indicator */}
            {(() => {
              const ca = parseFloat(currentScore.caScore) || 0;
              const exam = parseFloat(currentScore.examScore) || 0;
              const isValid = ca >= 0 && ca <= caMax && exam >= 0 && exam <= examMax && (ca > 0 || exam > 0);
              if (isValid) {
                return (
                  <View style={styles.validationIndicator}>
                    <CheckCircle size={16} color={theme.colors.success[500]} />
                    <Text style={styles.validationText}>Entry complete</Text>
                  </View>
                );
              }
              return null;
            })()}
          </Card>
        )}

        {/* Navigation Controls */}
        {!isSubmitted && (
          <View style={styles.navigationSection}>
            <Button
              title="Previous"
              onPress={handlePrevious}
              disabled={currentStudentIndex === 0}
              variant="outline"
              icon={<ChevronLeft size={18} color={theme.colors.primary.base} />}
              style={styles.navButton}
            />
            <Button
              title="Next Student"
              onPress={handleNext}
              disabled={currentStudentIndex === students.length - 1}
              icon={<ChevronRight size={18} color={theme.colors.text.inverse} />}
              style={styles.navButton}
            />
          </View>
        )}
      </ScrollView>

      {/* Sticky Footer Actions */}
      {!isSubmitted && (
        <View style={styles.footer}>
          <View style={styles.footerActions}>
            <Button
              title="Save Draft"
              onPress={handleSaveDraft}
              variant="outline"
              loading={submitting}
              icon={<Save size={18} color={theme.colors.primary.base} />}
              style={styles.footerButton}
            />
            <Button
              title="Preview All"
              onPress={() => setShowPreview(true)}
              variant="outline"
              icon={<Eye size={18} color={theme.colors.accent.base} />}
              style={styles.footerButton}
            />
          </View>
        </View>
      )}

      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Preview All Entries</Text>
            <Pressable onPress={() => setShowPreview(false)} style={styles.closeButton}>
              <X size={24} color={theme.colors.text.primary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <Card style={styles.previewCard}>
              <Text style={styles.previewTitle}>
                {className} - {subjectName}
              </Text>
              <Text style={styles.previewSubtitle}>
                Academic Year: {academicYear} | Term: {term}
              </Text>

              <View style={styles.previewList}>
                {students.map((student, index) => {
                  const score = scores[student.id] || { caScore: '', examScore: '', totalScore: 0, grade: '' };
                  const total = (parseFloat(score.caScore) || 0) + (parseFloat(score.examScore) || 0);
                  const grade = total > 0 ? getLetterGrade(total) : '-';
                  
                  return (
                    <View key={student.id} style={styles.previewRow}>
                      <View style={styles.previewStudentInfo}>
                        <Text style={styles.previewStudentName}>
                          {index + 1}. {student.first_name} {student.last_name}
                        </Text>
                        <Text style={styles.previewAdmission}>{student.admission_number}</Text>
                      </View>
                      <View style={styles.previewScores}>
                        <View style={styles.previewScoreItem}>
                          <Text style={styles.previewScoreLabel}>CA</Text>
                          <Text style={styles.previewScoreValue}>{score.caScore || '0'}</Text>
                        </View>
                        <View style={styles.previewScoreItem}>
                          <Text style={styles.previewScoreLabel}>Exam</Text>
                          <Text style={styles.previewScoreValue}>{score.examScore || '0'}</Text>
                        </View>
                        <View style={styles.previewScoreItem}>
                          <Text style={styles.previewScoreLabel}>Total</Text>
                          <Text style={styles.previewScoreValue}>{total.toFixed(1)}</Text>
                        </View>
                        <View style={styles.previewGradeItem}>
                          {grade !== '-' && <GradeBadge grade={grade} size="sm" />}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card>
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              title="Close"
              onPress={() => setShowPreview(false)}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Submit Final"
              onPress={handleSubmit}
              loading={submitting}
              icon={<Send size={18} color={theme.colors.text.inverse} />}
              style={styles.modalButton}
            />
          </View>
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
      paddingBottom: theme.spacing.xl,
    },
    // Top Header Section
    topHeader: {
      marginBottom: theme.spacing.lg,
    },
    headerInfo: {
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.roundness * 1.5,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    headerTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.md,
    },
    headerTitleContainer: {
      flex: 1,
    },
    className: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 2,
    },
    subjectName: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeights.medium,
    },
    submittedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs / 2,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.success[500] + '1A',
      borderWidth: 1,
      borderColor: theme.colors.success[500] + '33',
    },
    submittedText: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.success[500],
    },
    filtersRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    filterItem: {
      flex: 1,
    },
    filterLabel: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
      fontWeight: theme.typography.fontWeights.medium,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    filterInput: {
      marginBottom: 0,
    },
    filterPicker: {
      marginBottom: 0,
    },
    // Progress Section
    progressSection: {
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.roundness * 1.5,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    progressLabel: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    progressCount: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.primary.base,
    },
    progressBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    progressBar: {
      flex: 1,
      height: 10,
      backgroundColor: theme.colors.surface.secondary,
      borderRadius: theme.roundness * 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.primary.base,
      borderRadius: theme.roundness * 2,
    },
    progressPercent: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.secondary,
      minWidth: 45,
      textAlign: 'right',
    },
    offlineBanner: {
      marginTop: theme.spacing.sm,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.warn.base + '1A',
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.warn.base + '33',
    },
    offlineText: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.warn.base,
      textAlign: 'center',
      fontWeight: theme.typography.fontWeights.medium,
    },
    // Student Card
    studentCard: {
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.xl,
      borderRadius: theme.roundness * 1.5,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface.primary,
      shadowColor: theme.colors.background.dark ?? '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    studentHeader: {
      marginBottom: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.divider,
    },
    studentInfo: {
      flex: 1,
    },
    studentNameRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    studentName: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      flex: 1,
    },
    studentIndexBadge: {
      backgroundColor: theme.colors.primary.base + '1A',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.roundness * 2,
      borderWidth: 1,
      borderColor: theme.colors.primary.base + '33',
    },
    studentIndexText: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.primary.base,
    },
    admissionNumber: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs / 2,
      fontWeight: theme.typography.fontWeights.medium,
    },
    scoreEntrySection: {
      marginTop: theme.spacing.md,
    },
    validationIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
    },
    validationText: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.success[500],
    },
    // Navigation Section
    navigationSection: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.md,
    },
    navButton: {
      flex: 1,
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.md,
    },
    actionButton: {
      flex: 1,
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
    previewCard: {
      padding: theme.spacing.lg,
    },
    previewTitle: {
      fontSize: theme.typography.fontSizes.xl,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    previewSubtitle: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.lg,
    },
    previewList: {
      gap: theme.spacing.md,
    },
    previewRow: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    previewStudentInfo: {
      marginBottom: theme.spacing.sm,
    },
    previewStudentName: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 2,
    },
    previewAdmission: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    previewScores: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    previewScoreItem: {
      flex: 1,
      alignItems: 'center',
    },
    previewScoreLabel: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs / 2,
    },
    previewScoreValue: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    previewGradeItem: {
      width: 50,
      alignItems: 'center',
    },
    modalActions: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
      backgroundColor: theme.colors.surface.primary,
    },
    modalButton: {
      flex: 1,
    },
    footer: {
      backgroundColor: theme.colors.surface.primary,
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
      padding: theme.spacing.md,
      shadowColor: theme.colors.background.dark ?? '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
    footerActions: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    footerButton: {
      flex: 1,
    },
  });
