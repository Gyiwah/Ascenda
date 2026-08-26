import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/utils/useAuth';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { 
  BookOpen, 
  ClipboardList, 
  Users, 
  GraduationCap, 
  CheckCircle, 
  Clock,
  TrendingUp,
  FileText
} from 'lucide-react-native';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { getMyAssignments } from '@/api/teacher/assignments';
import { getAssessmentsForClass } from '@/api/teacher/assessments';
import { getStudentsForClass } from '@/api/teacher/students';
import { useToast } from '@/components/ToastContext';
import { schoolService } from '@/api/schools';

interface DashboardStats {
  totalClasses: number;
  totalSubjects: number;
  totalStudents: number;
  pendingAssessments: number;
  completedAssessments: number;
  totalAssignments: number;
}

export default function TeacherDashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const [stats, setStats] = useState<DashboardStats>({
    totalClasses: 0,
    totalSubjects: 0,
    totalStudents: 0,
    pendingAssessments: 0,
    completedAssessments: 0,
    totalAssignments: 0,
  });
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [user])
  );

  const loadStats = async () => {
    if (!user?.id || !user?.school_id) {
      setLoading(false);
      return;
    }

    try {
      const schoolResult = await schoolService.getById(user.school_id);
      if (schoolResult.data) {
        setSchoolName(schoolResult.data.name);
      }
      // Get all assignments for the teacher (without academic year filter to get all)
      const { data: assignmentsData, error: assignmentsError } = await getMyAssignments(
        user.id,
        user.school_id
      );

      if (assignmentsError) {
        console.error('[TeacherDashboard] Error loading assignments:', assignmentsError);
        throw assignmentsError;
      }

      const assignments = assignmentsData || [];
      const totalClasses = assignments.length;
      const subjectSet = new Set<string>();
      let totalSubjects = 0;
      let totalStudents = 0;
      let pendingAssessments = 0;
      let completedAssessments = 0;

      // Process each class assignment
      for (const assignmentGroup of assignments) {
        // Track unique subject ids across all classes for a distinct subject count
        for (const sg of assignmentGroup.subjects) {
          if (sg.subject?.id) subjectSet.add(sg.subject.id);
        }

        // Get students for this class
        const { data: studentsData, error: studentsError } = await getStudentsForClass(
          assignmentGroup.class.id,
          user.school_id
        );

        if (!studentsError && studentsData) {
          totalStudents += studentsData.length;

          // For each subject in the class, count the class-subject as completed or pending
          for (const subjectGroup of assignmentGroup.subjects) {
            const academicYear = subjectGroup.assignment?.academic_year || assignmentGroup.subjects[0]?.assignment?.academic_year;

            if (academicYear) {
              const { data: assessmentsData } = await getAssessmentsForClass(
                assignmentGroup.class.id,
                subjectGroup.subject.id,
                academicYear,
                1 // Term 1 (could be improved by using real term)
              );

              if (assessmentsData && assessmentsData.length > 0) {
                // If any assessment for this class+subject has a submitted_at, consider this class-subject completed
                const anySubmitted = assessmentsData.some(a => !!a.submitted_at);
                if (anySubmitted) {
                  completedAssessments += 1;
                } else {
                  pendingAssessments += 1;
                }
              } else {
                pendingAssessments += 1;
              }
            } else {
              // If there's no academic year info, treat the class-subject as pending
              pendingAssessments += 1;
            }
          }
        }
      }

      totalSubjects = subjectSet.size;

      setStats({
        totalClasses,
        totalSubjects,
        totalStudents,
        pendingAssessments,
        completedAssessments,
        totalAssignments: assignments.reduce((sum, g) => sum + g.subjects.length, 0),
      });
    } catch (error: any) {
      console.error('[TeacherDashboard] Error loading stats:', error);
      showToast('Failed to load dashboard stats', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
  };

  const navigateToMyClasses = () => {
    navigation.navigate('MyClasses');
  };

  if (loading) return <Loader />;

  const completionRate = stats.totalStudents > 0 
    ? Math.round((stats.completedAssessments / (stats.completedAssessments + stats.pendingAssessments)) * 100) 
    : 0;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={handleRefresh} 
          tintColor={theme.colors.primary.base} 
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{schoolName || 'Teacher Dashboard'}</Text>
          <Text style={styles.subtitle}>Welcome, {user?.full_name}</Text>
        </View>
        <View style={styles.roleBadge}>
          <GraduationCap size={16} color={theme.colors.primary.base} />
          <Text style={styles.roleText}>Teacher</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Quick Stats Row */}
        <View style={styles.quickStatsRow}>
          <Pressable onPress={navigateToMyClasses} style={styles.quickStatCard}>
            <BookOpen size={24} color={theme.colors.primary.base} />
            <Text style={styles.quickStatValue}>{stats.totalClasses}</Text>
            <Text style={styles.quickStatLabel}>Classrooms</Text>
          </Pressable>

          <Pressable onPress={navigateToMyClasses} style={styles.quickStatCard}>
            <FileText size={24} color={theme.colors.accent.base} />
            <Text style={styles.quickStatValue}>{stats.totalSubjects}</Text>
            <Text style={styles.quickStatLabel}>Subjects</Text>
          </Pressable>

          <Pressable onPress={navigateToMyClasses} style={styles.quickStatCard}>
            <Users size={24} color={theme.colors.warn.base} />
            <Text style={styles.quickStatValue}>{stats.totalStudents}</Text>
            <Text style={styles.quickStatLabel}>Students</Text>
          </Pressable>
        </View>

        {/* Assessment Stats */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Assessment Overview</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.colors.error.base + '1A' }]}>
                <Clock size={20} color={theme.colors.error.base} />
              </View>
              <Text style={styles.statValue}>{stats.pendingAssessments}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#10b9811A' }]}>
                <CheckCircle size={20} color="#10b981" />
              </View>
              <Text style={styles.statValue}>{stats.completedAssessments}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary.base + '1A' }]}>
                <TrendingUp size={20} color={theme.colors.primary.base} />
              </View>
              <Text style={styles.statValue}>{completionRate}%</Text>
              <Text style={styles.statLabel}>Completion</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Pressable 
            onPress={navigateToMyClasses}
            style={styles.actionButton}
          >


            <View style={styles.actionContent}>
              <BookOpen size={20} color={theme.colors.primary.base} />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>View My Classrooms</Text>
                <Text style={styles.actionSubtitle}>Manage classrooms and enter scores</Text>
              </View>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </Pressable>

          <Pressable 
            onPress={() => navigation.navigate('Attendance')}
            style={[styles.actionButton, { marginTop: theme.spacing.sm }]}
          >
            <View style={styles.actionContent}>
              <CheckCircle size={20} color={theme.colors.accent.base} />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Classroom Attendance</Text>
                <Text style={styles.actionSubtitle}>Mark and manage daily attendance register</Text>
              </View>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </Pressable>
        </Card>


        {/* Summary Info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <ClipboardList size={18} color={theme.colors.text.secondary} />
            <Text style={styles.infoText}>
              You have {stats.totalAssignments} active assignment{stats.totalAssignments !== 1 ? 's' : ''} across {stats.totalClasses} classroom{stats.totalClasses !== 1 ? 's' : ''}
            </Text>
          </View>
        </Card>

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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface.primary,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    title: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 2,
    },
    subtitle: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.secondary,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs / 2,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      backgroundColor: theme.colors.primary.base + '1A',
      borderRadius: theme.roundness,
    },
    roleText: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.primary.base,
    },
    content: {
      padding: theme.spacing.lg,
    },
    quickStatsRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    quickStatCard: {
      flex: 1,
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.roundness,
      padding: theme.spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    quickStatValue: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginTop: theme.spacing.xs,
    },
    quickStatLabel: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs / 2,
    },
    statsCard: {
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statIconContainer: {
      width: 48,
      height: 48,
      borderRadius: theme.roundness,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
    },
    statValue: {
      fontSize: theme.typography.fontSizes.xl,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 2,
    },
    statLabel: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    actionsCard: {
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.lg,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    actionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      flex: 1,
    },
    actionTextContainer: {
      flex: 1,
    },
    actionTitle: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 4,
    },
    actionSubtitle: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    actionArrow: {
      fontSize: theme.typography.fontSizes.xl,
      color: theme.colors.text.secondary,
    },
    infoCard: {
      padding: theme.spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    infoText: {
      flex: 1,
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      lineHeight: theme.typography.fontSizes.base * 1.5,
    },
  });
