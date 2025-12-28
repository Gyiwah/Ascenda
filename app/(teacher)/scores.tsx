import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/hooks/useAuth';
import { assessmentService } from '@/services/supabase/assessments';
import { studentService } from '@/services/supabase/students';
import { computeGrade, validateScores, getGradeColor } from '@/services/helpers/grading';
import { colors, spacing, typography, hexToRgba } from '@/theme';
import { ChevronDown, Save, Send, CheckCircle } from 'lucide-react-native';

interface ScoreEntry {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  caScore: string;
  examScore: string;
  total: number;
  grade: string;
  existingAssessment?: any;
}

export default function ScoresScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [students, setStudents] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreEntry>>({});
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      loadStudents();
    }
  }, [selectedAssignment]);

  const loadAssignments = async () => {
    if (!user?.id) return;

    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}/${currentYear + 1}`;

    const { data } = await assessmentService.getTeacherAssignments(
      user.id,
      academicYear
    );

    if (data) {
      setAssignments(data);
      if (data.length > 0 && !selectedAssignment) {
        setSelectedAssignment(data[0]);
      }
    }
    setLoading(false);
  };

  const loadStudents = async () => {
    if (!selectedAssignment || !user?.school_id) return;

    setLoading(true);
    const { data } = await studentService.getByClass(selectedAssignment.class_id);

    if (data) {
      setStudents(data);
      loadExistingScores(data);
    }
    setLoading(false);
  };

  const loadExistingScores = async (studentList: any[]) => {
    if (!selectedAssignment || !user?.id) return;

    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}/${currentYear + 1}`;

    const scoreEntries: Record<string, ScoreEntry> = {};

    for (const student of studentList) {
      const { data: assessment } = await assessmentService.getByStudent(
        student.id,
        academicYear,
        selectedTerm
      );

      const existing = assessment?.find(
        (a: any) => a.subject_id === selectedAssignment.subject_id
      );

      scoreEntries[student.id] = {
        studentId: student.id,
        studentName: `${student.first_name} ${student.last_name}`,
        admissionNumber: student.admission_number,
        caScore: existing?.ca_score?.toString() || '',
        examScore: existing?.exam_score?.toString() || '',
        total: existing?.total_score || 0,
        grade: existing?.grade || '',
        existingAssessment: existing,
      };
    }

    setScores(scoreEntries);
  };

  const updateScore = (studentId: string, field: 'caScore' | 'examScore', value: string) => {
    const entry = scores[studentId] || {
      studentId,
      studentName: students.find((s) => s.id === studentId)?.name || '',
      admissionNumber: students.find((s) => s.id === studentId)?.admission_number || '',
      caScore: '',
      examScore: '',
      total: 0,
      grade: '',
    };

    const updatedEntry = { ...entry, [field]: value };

    const caScore = parseFloat(updatedEntry.caScore) || 0;
    const examScore = parseFloat(updatedEntry.examScore) || 0;

    const errors = validateScores(caScore, examScore);
    if (errors.length > 0 && (caScore > 0 || examScore > 0)) {
      // Don't show error for empty fields
      return;
    }

    const { total, grade } = computeGrade(caScore, examScore);
    updatedEntry.total = total;
    updatedEntry.grade = grade;

    setScores({ ...scores, [studentId]: updatedEntry });
  };

  const saveScores = async (submit: boolean = false) => {
    if (!selectedAssignment || !user?.id) return;

    setSaving(true);
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}/${currentYear + 1}`;

    const errors: string[] = [];
    const updates: Promise<any>[] = [];

    for (const studentId in scores) {
      const entry = scores[studentId];
      const caScore = parseFloat(entry.caScore) || 0;
      const examScore = parseFloat(entry.examScore) || 0;

      if (caScore === 0 && examScore === 0) continue; // Skip empty entries

      const validationErrors = validateScores(caScore, examScore);
      if (validationErrors.length > 0) {
        errors.push(`${entry.studentName}: ${validationErrors.join(', ')}`);
        continue;
      }

      const { total, grade } = computeGrade(caScore, examScore);

      const assessmentData = {
        student_id: studentId,
        subject_id: selectedAssignment.subject_id,
        class_id: selectedAssignment.class_id,
        teacher_id: user.id,
        academic_year: academicYear,
        term: selectedTerm,
        ca_score: caScore,
        exam_score: examScore,
        total_score: total,
        grade,
        submitted_at: submit ? new Date().toISOString() : undefined,
        is_locked: false,
      };

      if (entry.existingAssessment) {
        if (entry.existingAssessment.is_locked) {
          errors.push(`${entry.studentName}: Assessment is locked`);
          continue;
        }
        updates.push(
          assessmentService.update(entry.existingAssessment.id, assessmentData)
        );
      } else {
        updates.push(assessmentService.create(assessmentData));
      }
    }

    if (errors.length > 0) {
      Alert.alert('Validation Errors', errors.join('\n'));
      setSaving(false);
      return;
    }

    try {
      await Promise.all(updates);
      Alert.alert(
        'Success',
        submit ? 'Scores submitted successfully!' : 'Scores saved as draft!',
        [{ text: 'OK', onPress: () => loadStudents() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save scores');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !selectedAssignment) return <Loader />;

  if (assignments.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No class assignments found</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Record Scores</Text>
      </View>

      <View style={styles.selectorContainer}>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowAssignmentModal(true)}
        >
          <View style={styles.selectorContent}>
            <Text style={styles.selectorLabel}>Class & Subject</Text>
            <Text style={styles.selectorValue}>
              {selectedAssignment
                ? `${selectedAssignment.classes?.name} - ${selectedAssignment.subjects?.name}`
                : 'Select Assignment'}
            </Text>
          </View>
          <ChevronDown size={20} color={colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowTermModal(true)}
        >
          <View style={styles.selectorContent}>
            <Text style={styles.selectorLabel}>Term</Text>
            <Text style={styles.selectorValue}>Term {selectedTerm}</Text>
          </View>
          <ChevronDown size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {students.map((student) => {
          const entry = scores[student.id] || {
            studentId: student.id,
            studentName: `${student.first_name} ${student.last_name}`,
            admissionNumber: student.admission_number,
            caScore: '',
            examScore: '',
            total: 0,
            grade: '',
          };
          const isLocked = entry.existingAssessment?.is_locked;

          return (
            <Card key={student.id} style={styles.scoreCard}>
              <View style={styles.studentHeader}>
                <View>
                  <Text style={styles.studentName}>{entry.studentName}</Text>
                  <Text style={styles.admissionNumber}>{entry.admissionNumber}</Text>
                </View>
                {isLocked && (
                  <View style={styles.lockedBadge}>
                    <CheckCircle size={16} color={colors.success[500]} />
                    <Text style={styles.lockedText}>Locked</Text>
                  </View>
                )}
              </View>

              <View style={styles.scoreInputs}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CA (0-40)</Text>
                  <TextInput
                    style={[
                      styles.input,
                      isLocked && styles.inputDisabled,
                    ]}
                    value={entry.caScore}
                    onChangeText={(value) => updateScore(student.id, 'caScore', value)}
                    keyboardType="numeric"
                    placeholder="0"
                    editable={!isLocked}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Exam (0-60)</Text>
                  <TextInput
                    style={[
                      styles.input,
                      isLocked && styles.inputDisabled,
                    ]}
                    value={entry.examScore}
                    onChangeText={(value) => updateScore(student.id, 'examScore', value)}
                    keyboardType="numeric"
                    placeholder="0"
                    editable={!isLocked}
                  />
                </View>

                <View style={styles.resultGroup}>
                  <Text style={styles.resultLabel}>Total</Text>
                  <Text style={[styles.resultValue, { color: getGradeColor(entry.grade) }]}>
                    {entry.total || '-'}
                  </Text>
                  <Text style={[styles.gradeBadge, { backgroundColor: getGradeColor(entry.grade) + '20' }]}>
                    {entry.grade || '-'}
                  </Text>
                </View>
              </View>
            </Card>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Save Draft"
          onPress={() => saveScores(false)}
          loading={saving}
          variant="outline"
          style={styles.footerButton}
        />
        <Button
          title="Submit"
          onPress={() => saveScores(true)}
          loading={saving}
          style={styles.footerButton}
        />
      </View>

      {/* Assignment Selection Modal */}
      <Modal
        visible={showAssignmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAssignmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Assignment</Text>
            <ScrollView>
              {assignments.map((assignment) => (
                <TouchableOpacity
                  key={assignment.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedAssignment(assignment);
                    setShowAssignmentModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {assignment.classes?.name} - {assignment.subjects?.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button
              title="Cancel"
              onPress={() => setShowAssignmentModal(false)}
              variant="outline"
            />
          </View>
        </View>
      </Modal>

      {/* Term Selection Modal */}
      <Modal
        visible={showTermModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTermModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Term</Text>
            {[1, 2, 3].map((term) => (
              <TouchableOpacity
                key={term}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedTerm(term);
                  setShowTermModal(false);
                  loadStudents();
                }}
              >
                <Text style={styles.modalItemText}>Term {term}</Text>
              </TouchableOpacity>
            ))}
            <Button
              title="Cancel"
              onPress={() => setShowTermModal(false)}
              variant="outline"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    padding: spacing.xl,
    backgroundColor: colors.primary[600],
  },
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.text.inverse,
  },
  selectorContainer: {
    padding: spacing.md,
    backgroundColor: colors.background.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.light,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    marginBottom: spacing.sm,
  },
  selectorContent: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
  },
  selectorValue: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  scoreCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  studentName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
  },
  admissionNumber: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[500] + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  lockedText: {
    fontSize: typography.fontSizes.xs,
    color: colors.success[600],
    marginLeft: spacing.xs / 2,
  },
  scoreInputs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: typography.fontSizes.base,
    backgroundColor: colors.background.light,
  },
  inputDisabled: {
    backgroundColor: colors.neutral[100],
    opacity: 0.6,
  },
  resultGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  resultLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
  },
  resultValue: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.xs / 2,
  },
  gradeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.background.light,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
  emptyText: {
    fontSize: typography.fontSizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing['3xl'],
  },
  backButton: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: hexToRgba(colors.background.dark ?? '#000000', 0.5),
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.light,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  modalItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  modalItemText: {
    fontSize: typography.fontSizes.base,
    color: colors.text.primary,
  },
});
