import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/utils/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { TerminalReportCard } from '@/components/reports/TerminalReportCard';
import { generateReportCardData, getSchoolGradeBands, ReportCardData, GradeBandConfig } from '@/api/headmaster/reportCards';
import { studentService } from '@/api/students';
import { Student } from '@/types/database';
import { FileText, CheckCircle } from 'lucide-react-native';

export default function BulkReportCardsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const classId = route.params?.classId;
  const className = route.params?.className || 'Class';
  const studentIds = route.params?.studentIds || [];
  const currentYear = new Date().getFullYear();
  const defaultAcademicYear = `${currentYear}/${currentYear + 1}`;
  const academicYear = route.params?.academicYear || defaultAcademicYear;
  const term = route.params?.term || 1;

  const [students, setStudents] = useState<Student[]>([]);
  const [reportCards, setReportCards] = useState<Map<string, ReportCardData>>(new Map());
  const [gradeBands, setGradeBands] = useState<GradeBandConfig[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (studentIds.length > 0 && user?.school_id) {
        loadData();
      }
    }, [studentIds, user?.school_id, academicYear, term])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      // Load students
      const studentsData: Student[] = [];
      for (const studentId of studentIds) {
        const { data, error } = await studentService.getById(studentId);
        if (!error && data) {
          studentsData.push(data);
        }
      }
      setStudents(studentsData);

      // Load grade bands
      if (user?.school_id) {
        const bands = await getSchoolGradeBands(user.school_id);
        setGradeBands(bands);
      }
    } catch (err: any) {
      console.error('[BulkReportCardsScreen] Error loading data:', err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateAllReports = async () => {
    if (students.length === 0) return;

    setGenerating(true);
    setGeneratedCount(0);
    const reports = new Map<string, ReportCardData>();

    try {
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const { data, error } = await generateReportCardData(student.id, academicYear, term);
        
        if (error) {
          console.error(`[BulkReportCardsScreen] Error generating report for ${student.id}:`, error);
          continue;
        }

        if (data) {
          reports.set(student.id, data);
          setGeneratedCount(i + 1);
        }
      }

      setReportCards(reports);
      showToast(`Generated ${reports.size} report card(s)`, 'success');
    } catch (err: any) {
      console.error('[BulkReportCardsScreen] Error generating reports:', err);
      showToast('Failed to generate some report cards', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewIndividual = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    navigation.navigate('ViewReportCard', {
      studentId,
      studentName: `${student.first_name} ${student.last_name}`,
      classId,
      className,
      academicYear,
      term,
    });
  };

  if (loading) {
    return <Loader />;
  }

  const currentStudent = students[currentViewIndex];
  const currentReport = currentStudent ? reportCards.get(currentStudent.id) : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Bulk Report Cards - {className}
        </Text>
        <Text style={styles.headerSubtitle}>
          {students.length} student(s) | Term {term} | {academicYear}
        </Text>
      </View>

      {/* Actions */}
      <Card style={styles.actionsCard}>
        <Button
          title={generating ? `Generating... (${generatedCount}/${students.length})` : 'Generate All Reports'}
          onPress={generateAllReports}
          loading={generating}
          disabled={generating || students.length === 0}
          icon={<FileText size={18} color={theme.colors.background.primary} />}
        />
        {reportCards.size > 0 && (
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              ✓ {reportCards.size} report card(s) generated
            </Text>
          </View>
        )}
      </Card>

      {/* Students List */}
      <Card style={styles.studentsCard}>
        <Text style={styles.sectionTitle}>Students</Text>
        <ScrollView style={styles.studentsList}>
          {students.map((student, index) => {
            const hasReport = reportCards.has(student.id);
            return (
              <Pressable
                key={student.id}
                style={[
                  styles.studentItem,
                  currentViewIndex === index && styles.studentItemActive,
                ]}
                onPress={() => {
                  setCurrentViewIndex(index);
                  if (hasReport) {
                    handleViewIndividual(student.id);
                  }
                }}
              >
                <View style={styles.studentInfo}>
                  <Text style={styles.studentNumber}>{index + 1}.</Text>
                  <View style={styles.studentDetails}>
                    <Text style={styles.studentName}>
                      {student.first_name} {student.last_name}
                    </Text>
                    <Text style={styles.studentAdmission}>{student.admission_number}</Text>
                  </View>
                </View>
                {hasReport ? (
                  <CheckCircle size={20} color={theme.colors.primary.base} />
                ) : (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingText}>Pending</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </Card>

      {/* Preview Current Report */}
      {currentReport && (
        <Card style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>
              Preview: {currentStudent?.first_name} {currentStudent?.last_name}
            </Text>
            <Button
              title="View Full"
              onPress={() => handleViewIndividual(currentStudent!.id)}
              variant="outline"
              style={styles.viewButton}
            />
          </View>
          <ScrollView style={styles.previewScroll} nestedScrollEnabled>
            <View style={styles.previewContent}>
              <TerminalReportCard data={currentReport} gradeBands={gradeBands} />
            </View>
          </ScrollView>
        </Card>
      )}

      {reportCards.size === 0 && !generating && (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Click &apos;Generate All Reports&apos; to create report cards for all students
          </Text>
        </Card>
      )}
    </View>
  );
}

const makeStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.secondary,
    },
    header: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface.primary,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: theme.typography.fontSizes.xl,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    headerSubtitle: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    actionsCard: {
      margin: theme.spacing.md,
    },
    statsRow: {
      marginTop: theme.spacing.md,
      alignItems: 'center',
    },
    statsText: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.primary.base,
      fontWeight: theme.typography.fontWeights.medium,
    },
    studentsCard: {
      margin: theme.spacing.md,
      maxHeight: 200,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    studentsList: {
      maxHeight: 150,
    },
    studentItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.sm,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface.secondary,
      marginBottom: theme.spacing.xs,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    studentItemActive: {
      borderColor: theme.colors.primary.base,
      backgroundColor: theme.colors.primary.base + '1A',
    },
    studentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flex: 1,
    },
    studentNumber: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      width: 30,
    },
    studentDetails: {
      flex: 1,
    },
    studentName: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 2,
    },
    studentAdmission: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
    },
    pendingBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs / 2,
      borderRadius: theme.roundness / 2,
      backgroundColor: theme.colors.warn.base + '1A',
    },
    pendingText: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.warn.base,
      fontWeight: theme.typography.fontWeights.medium,
    },
    previewCard: {
      margin: theme.spacing.md,
      flex: 1,
    },
    previewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    previewTitle: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      flex: 1,
    },
    viewButton: {
      paddingHorizontal: theme.spacing.md,
    },
    previewScroll: {
      maxHeight: 400,
    },
    previewContent: {
      padding: theme.spacing.sm,
    },
    emptyCard: {
      margin: theme.spacing.md,
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
  });

