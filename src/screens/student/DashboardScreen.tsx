import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/utils/useAuth';
import { studentApiService, StudentScoreItem } from '@/api/student';
import { attendanceService } from '@/api/attendance';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import {
  GraduationCap,
  BookOpen,
  Award,
  Calendar,
  CheckCircle,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react-native';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { StudentUser } from '@/types/database';

export default function StudentDashboardScreen() {
  const { user } = useAuth();
  const theme = useAppTheme();
  const navigation = useNavigation<any>();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const student = user as StudentUser | null;
  const [className, setClassName] = useState<string>('Enrolled Class');
  const [academicYear, setAcademicYear] = useState<string>('2024/2025');
  const [scores, setScores] = useState<StudentScoreItem[]>([]);
  const [attendanceRate, setAttendanceRate] = useState<number>(100);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAllStudentData();
  }, [student?.id, student?.class_id, student?.school_id]);

  const loadAllStudentData = async () => {
    if (!student?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      // Load class info
      if (student.class_id && student.school_id) {
        const { data: cls } = await studentApiService.getStudentClass(
          student.class_id,
          student.school_id
        );
        if (cls) {
          setClassName(cls.name);
          setAcademicYear(cls.academic_year);
        }
      }

      // Load subject scores
      if (student.class_id) {
        const { data: scoreData } = await studentApiService.getStudentScores(
          student.id,
          student.class_id
        );
        setScores(scoreData || []);
      }

      // Load attendance summary
      if (student.class_id) {
        const att = await attendanceService.getStudentAttendanceSummary(
          student.id,
          student.class_id
        );
        setAttendanceRate(att.rate);
      }
    } catch (err: any) {
      console.warn('[StudentDashboard] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllStudentData();
    setRefreshing(false);
  };

  const overallAverage = useMemo(() => {
    if (scores.length === 0) return 0;
    const total = scores.reduce((sum, s) => sum + s.total_score, 0);
    return Math.round(total / scores.length);
  }, [scores]);

  if (loading && !student) {
    return <Loader />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary.base}
        />
      }
    >
      {/* Student Welcome Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <GraduationCap size={32} color="#ffffff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{student?.full_name || 'Student'}</Text>
          <Text style={styles.subtitle}>
            Admission No: {student?.admission_number || 'N/A'}
          </Text>
          <Text style={styles.classBadgeText}>
            {className} • {academicYear}
          </Text>
        </View>
      </View>

      {/* High-level Academic Stats */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Award size={24} color={theme.colors.primary.base} />
          <Text style={styles.statValue}>
            {scores.length > 0 ? `${overallAverage}%` : 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Average Score</Text>
        </Card>

        <Card style={styles.statCard}>
          <BookOpen size={24} color={theme.colors.accent.base} />
          <Text style={styles.statValue}>{scores.length}</Text>
          <Text style={styles.statLabel}>Subjects</Text>
        </Card>

        <Card style={styles.statCard}>
          <CheckCircle size={24} color={theme.colors.success.base} />
          <Text style={styles.statValue}>{attendanceRate}%</Text>
          <Text style={styles.statLabel}>Attendance</Text>
        </Card>
      </View>

      {/* Quick Navigation Cards */}
      <Text style={styles.sectionTitle}>Academic Features</Text>

      <TouchableOpacity
        style={styles.actionCard}
        onPress={() => navigation.navigate('StudentSubjects')}
      >
        <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary.base + '1A' }]}>
          <BookOpen size={22} color={theme.colors.primary.base} />
        </View>
        <View style={styles.actionTextContainer}>
          <Text style={styles.actionTitle}>Subjects & Continuous Assessment</Text>
          <Text style={styles.actionSubtitle}>
            View class scores (30%), exam marks (70%), and grade breakdown
          </Text>
        </View>
        <ArrowRight size={18} color={theme.colors.text.secondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionCard}
        onPress={() => navigation.navigate('StudentReportCards')}
      >
        <View style={[styles.actionIcon, { backgroundColor: theme.colors.accent.base + '1A' }]}>
          <FileText size={22} color={theme.colors.accent.base} />
        </View>
        <View style={styles.actionTextContainer}>
          <Text style={styles.actionTitle}>Terminal Report Cards</Text>
          <Text style={styles.actionSubtitle}>
            Official published term reports, remarks, and PDF certificates
          </Text>
        </View>
        <ArrowRight size={18} color={theme.colors.text.secondary} />
      </TouchableOpacity>

      {/* Recent Subject Performance Preview */}
      {scores.length > 0 && (
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Recent Subject Performance</Text>
          {scores.slice(0, 3).map((item) => (
            <Card key={item.id || item.subject_id} style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewSubjectName}>{item.subject_name}</Text>
                <View style={[styles.gradeChip, { backgroundColor: theme.colors.primary.base + '1A' }]}>
                  <Text style={[styles.gradeChipText, { color: theme.colors.primary.base }]}>
                    Grade {item.grade}
                  </Text>
                </View>
              </View>
              <View style={styles.previewScoreRow}>
                <Text style={styles.previewScoreText}>
                  CA: <Text style={styles.boldScore}>{item.class_score}</Text> / 30
                </Text>
                <Text style={styles.previewScoreText}>
                  Exam: <Text style={styles.boldScore}>{item.exam_score}</Text> / 70
                </Text>
                <Text style={styles.previewScoreText}>
                  Total: <Text style={[styles.boldScore, { color: theme.colors.primary.base }]}>{item.total_score}</Text>
                </Text>
              </View>
            </Card>
          ))}
        </View>
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
      gap: theme.spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.radii.lg,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary.base,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: theme.typography.fontSizes.xl,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
    },
    subtitle: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginTop: 2,
    },
    classBadgeText: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.primary.base,
      fontWeight: theme.typography.fontWeights.semibold,
      marginTop: 4,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    statCard: {
      flex: 1,
      padding: theme.spacing.md,
      alignItems: 'center',
      gap: 4,
    },
    statValue: {
      fontSize: theme.typography.fontSizes.xl,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginTop: 4,
    },
    statLabel: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginTop: theme.spacing.xs,
    },
    actionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.radii.md,
      gap: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    actionIcon: {
      width: 44,
      height: 44,
      borderRadius: theme.radii.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionTextContainer: {
      flex: 1,
    },
    actionTitle: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    actionSubtitle: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
      marginTop: 2,
    },
    previewSection: {
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    previewCard: {
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    previewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    previewSubjectName: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    gradeChip: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.radii.full,
    },
    gradeChipText: {
      fontSize: 11,
      fontWeight: theme.typography.fontWeights.bold,
    },
    previewScoreRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    previewScoreText: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
    },
    boldScore: {
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
    },
  });
