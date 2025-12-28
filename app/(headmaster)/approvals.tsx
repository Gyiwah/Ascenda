import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/hooks/useAuth';
import { assessmentService } from '@/services/supabase/assessments';
import { classService } from '@/services/supabase/classes';
import { getGradeColor } from '@/services/helpers/grading';
import { colors, spacing, typography, hexToRgba } from '@/theme';
import { CheckCircle, XCircle, Lock, Eye, Filter } from 'lucide-react-native';

export default function ApprovalsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<any[]>([]);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAssessments();
  }, [assessments, selectedClass, selectedTerm]);

  const loadData = async () => {
    if (!user?.school_id) return;

    setLoading(true);
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}/${currentYear + 1}`;

    // Load classes
    const { data: classesData } = await classService.getAll(user.school_id, academicYear);
    if (classesData) setClasses(classesData);

    // Load pending assessments
    await loadPendingAssessments(academicYear, selectedTerm);
    setLoading(false);
  };

  const loadPendingAssessments = async (academicYear: string, term: number) => {
    const { data } = await assessmentService.getPendingApprovals(
      user?.school_id || '',
      academicYear,
      term
    );

    if (data) {
      // Group by class and subject
      const grouped = data.reduce((acc: any, assessment: any) => {
        const key = `${assessment.class_id}_${assessment.subject_id}`;
        if (!acc[key]) {
          acc[key] = {
            class_id: assessment.class_id,
            class_name: assessment.classes?.name || 'Unknown',
            subject_id: assessment.subject_id,
            subject_name: assessment.subjects?.name || 'Unknown',
            assessments: [],
          };
        }
        acc[key].assessments.push(assessment);
        return acc;
      }, {});

      setAssessments(Object.values(grouped));
    }
  };

  const filterAssessments = () => {
    let filtered = assessments;

    if (selectedClass) {
      filtered = filtered.filter((group) => group.class_id === selectedClass);
    }

    setFilteredAssessments(filtered);
  };

  const approveAssessment = async (assessment: any) => {
    if (!user?.id) return;

    Alert.alert(
      'Approve Assessment',
      `Approve score for ${assessment.students?.first_name} ${assessment.students?.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setProcessing(true);
            try {
              await assessmentService.update(assessment.id, {
                approved_at: new Date().toISOString(),
                approved_by: user.id,
              } as any);
              Alert.alert('Success', 'Assessment approved successfully!');
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to approve assessment');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const lockClassTerm = async (classId: string, className: string) => {
    if (!user?.id) return;

    Alert.alert(
      'Lock Term Results',
      `Lock all assessments for ${className}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Lock',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              const currentYear = new Date().getFullYear();
              const academicYear = `${currentYear}/${currentYear + 1}`;

              await assessmentService.lockAssessments(classId, academicYear, selectedTerm);
              await assessmentService.approveAssessments(
                classId,
                academicYear,
                selectedTerm,
                user.id
              );

              Alert.alert('Success', 'Term results locked successfully!');
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to lock assessments');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const viewAssessmentDetails = (assessment: any) => {
    setSelectedAssessment(assessment);
    setShowDetailModal(true);
  };

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Approve Assessments</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={20} color={colors.text.inverse} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        <Text style={styles.filterText}>Term {selectedTerm}</Text>
        {selectedClass && (
          <Text style={styles.filterText}>
            • {classes.find((c) => c.id === selectedClass)?.name || 'All Classes'}
          </Text>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {filteredAssessments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No pending assessments</Text>
            <Text style={styles.emptySubtext}>
              All submitted assessments have been approved
            </Text>
          </View>
        ) : (
          filteredAssessments.map((group) => (
            <Card key={`${group.class_id}_${group.subject_id}`} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View>
                  <Text style={styles.groupTitle}>{group.class_name}</Text>
                  <Text style={styles.groupSubtitle}>{group.subject_name}</Text>
                </View>
                <View style={styles.groupStats}>
                  <Text style={styles.groupCount}>{group.assessments.length} assessments</Text>
                  <TouchableOpacity
                    style={styles.lockButton}
                    onPress={() => lockClassTerm(group.class_id, group.class_name)}
                    disabled={processing}
                  >
                    <Lock size={16} color={colors.primary[600]} />
                    <Text style={styles.lockButtonText}>Lock Term</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {group.assessments.map((assessment: any) => (
                <View key={assessment.id} style={styles.assessmentCard}>
                  <View style={styles.assessmentHeader}>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>
                        {assessment.students?.first_name} {assessment.students?.last_name}
                      </Text>
                      <Text style={styles.admissionNumber}>
                        {assessment.students?.admission_number}
                      </Text>
                    </View>
                    <View style={styles.scoreInfo}>
                      <Text style={styles.scoreValue}>
                        {assessment.total_score}%
                      </Text>
                      <Text
                        style={[
                          styles.gradeBadge,
                          { backgroundColor: getGradeColor(assessment.grade) + '20' },
                        ]}
                      >
                        {assessment.grade}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.scoreBreakdown}>
                    <Text style={styles.breakdownText}>
                      CA: {assessment.ca_score} / Exam: {assessment.exam_score}
                    </Text>
                    <Text style={styles.breakdownText}>
                      Teacher: {assessment.teacher?.full_name || 'Unknown'}
                    </Text>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => viewAssessmentDetails(assessment)}
                    >
                      <Eye size={16} color={colors.primary[600]} />
                      <Text style={styles.viewButtonText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => approveAssessment(assessment)}
                      disabled={processing || assessment.is_locked}
                    >
                      <CheckCircle size={16} color={colors.success[600]} />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </Card>
          ))
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Assessments</Text>

            <Text style={styles.modalLabel}>Term</Text>
            <View style={styles.termSelector}>
              {[1, 2, 3].map((term) => (
                <TouchableOpacity
                  key={term}
                  style={[
                    styles.termButton,
                    selectedTerm === term && styles.termButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedTerm(term);
                    loadData();
                  }}
                >
                  <Text
                    style={[
                      styles.termButtonText,
                      selectedTerm === term && styles.termButtonTextActive,
                    ]}
                  >
                    Term {term}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Class</Text>
            <TouchableOpacity
              style={styles.classOption}
              onPress={() => {
                setSelectedClass(null);
                setShowFilterModal(false);
              }}
            >
              <Text style={styles.classOptionText}>All Classes</Text>
            </TouchableOpacity>
            {classes.map((classItem) => (
              <TouchableOpacity
                key={classItem.id}
                style={styles.classOption}
                onPress={() => {
                  setSelectedClass(classItem.id);
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.classOptionText}>{classItem.name}</Text>
              </TouchableOpacity>
            ))}

            <Button
              title="Close"
              onPress={() => setShowFilterModal(false)}
              variant="outline"
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      {/* Assessment Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assessment Details</Text>

            {selectedAssessment && (
              <ScrollView>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Student</Text>
                  <Text style={styles.detailValue}>
                    {selectedAssessment.students?.first_name}{' '}
                    {selectedAssessment.students?.last_name}
                  </Text>
                  <Text style={styles.detailValue}>
                    {selectedAssessment.students?.admission_number}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Subject</Text>
                  <Text style={styles.detailValue}>
                    {selectedAssessment.subjects?.name} ({selectedAssessment.subjects?.code})
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Scores</Text>
                  <View style={styles.scoreDetailRow}>
                    <Text style={styles.scoreDetailLabel}>CA Score:</Text>
                    <Text style={styles.scoreDetailValue}>{selectedAssessment.ca_score}/40</Text>
                  </View>
                  <View style={styles.scoreDetailRow}>
                    <Text style={styles.scoreDetailLabel}>Exam Score:</Text>
                    <Text style={styles.scoreDetailValue}>{selectedAssessment.exam_score}/60</Text>
                  </View>
                  <View style={styles.scoreDetailRow}>
                    <Text style={styles.scoreDetailLabel}>Total Score:</Text>
                    <Text style={styles.scoreDetailValue}>
                      {selectedAssessment.total_score}/100
                    </Text>
                  </View>
                  <View style={styles.scoreDetailRow}>
                    <Text style={styles.scoreDetailLabel}>Grade:</Text>
                    <Text
                      style={[
                        styles.scoreDetailValue,
                        { color: getGradeColor(selectedAssessment.grade) },
                      ]}
                    >
                      {selectedAssessment.grade}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Teacher</Text>
                  <Text style={styles.detailValue}>
                    {selectedAssessment.teacher?.full_name || 'Unknown'}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={styles.detailValue}>
                    {selectedAssessment.is_locked ? 'Locked' : 'Pending Approval'}
                  </Text>
                  {selectedAssessment.submitted_at && (
                    <Text style={styles.detailSubtext}>
                      Submitted: {new Date(selectedAssessment.submitted_at).toLocaleString()}
                    </Text>
                  )}
                </View>
              </ScrollView>
            )}

            <Button
              title="Close"
              onPress={() => setShowDetailModal(false)}
              style={styles.modalButton}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.primary[600],
  },
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.text.inverse,
  },
  filterButton: {
    padding: spacing.sm,
  },
  filterBar: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.neutral[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  filterText: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing['3xl'],
  },
  emptyText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
  },
  groupCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  groupTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  groupSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  groupStats: {
    alignItems: 'flex-end',
  },
  groupCount: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  lockButtonText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary[600],
    marginLeft: spacing.xs / 2,
  },
  assessmentCard: {
    backgroundColor: colors.background.light,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
  },
  admissionNumber: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  scoreInfo: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  gradeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: spacing.xs / 2,
  },
  scoreBreakdown: {
    marginBottom: spacing.sm,
  },
  breakdownText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
    padding: spacing.sm,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary[600],
    marginLeft: spacing.xs / 2,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success[500] + '20',
    padding: spacing.sm,
    borderRadius: 8,
  },
  approveButtonText: {
    fontSize: typography.fontSizes.sm,
    color: colors.success[600],
    marginLeft: spacing.xs / 2,
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
  modalLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  termSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  termButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    alignItems: 'center',
  },
  termButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  termButtonText: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.primary,
  },
  termButtonTextActive: {
    color: colors.text.inverse,
  },
  classOption: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  classOptionText: {
    fontSize: typography.fontSizes.base,
    color: colors.text.primary,
  },
  modalButton: {
    marginTop: spacing.lg,
  },
  detailSection: {
    marginBottom: spacing.lg,
  },
  detailLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  detailValue: {
    fontSize: typography.fontSizes.base,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  detailSubtext: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
  },
  scoreDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  scoreDetailLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
  },
  scoreDetailValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
  },
});
