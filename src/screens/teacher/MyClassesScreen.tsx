import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/utils/useAuth';
import { getMyAssignments } from '@/api/teacher/assignments';
import { getStudentsForClass } from '@/api/teacher/students';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { BookOpen, Users, GraduationCap, MessageSquare } from 'lucide-react-native';

interface GroupedAssignment {
  class: { id: string; name: string; level: number };
  subjects: Array<{
    subject: { id: string; name: string; code: string };
    assignment: any;
  }>;
}

export default function MyClassesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [assignments, setAssignments] = useState<GroupedAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id && user?.school_id) {
        loadAssignments();
      }
    }, [user?.id, user?.school_id])
  );

  const loadAssignments = async () => {
    if (!user?.id || !user?.school_id) return;

    setLoading(true);
    try {
      // Don't filter by academic year initially - show all assignments
      const { data, error } = await getMyAssignments(user.id, user.school_id);
      
      if (error) {
        console.error('[MyClassesScreen] Error from getMyAssignments:', error);
        throw error;
      }
      
      console.log('[MyClassesScreen] Loaded assignments:', data?.length || 0);
      setAssignments(data || []);
      
      // Load student counts for each class
      if (data && data.length > 0) {
        const counts: Record<string, number> = {};
        for (const group of data) {
          const { data: students } = await getStudentsForClass(group.class.id, user.school_id);
          counts[group.class.id] = students?.length || 0;
        }
        setStudentCounts(counts);
      }
    } catch (err: any) {
      console.error('[MyClassesScreen] Error loading assignments:', err);
      showToast(err?.message || 'Failed to load classes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAssignments();
    setRefreshing(false);
  };

  const handleClassPress = (classId: string, subjectId: string, className: string, subjectName: string) => {
    navigation.navigate('StudentScoreEntry', {
      classId,
      subjectId,
      className,
      subjectName,
    });
  };

  const handleRemarksPress = (classId: string, className: string, academicYear: string) => {
    navigation.navigate('RemarkEntry', {
      classId,
      className,
      academicYear,
    });
  };

  if (loading && assignments.length === 0) {
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
      <View style={styles.header}>
        <Text style={styles.title}>My Classes</Text>
        <Text style={styles.subtitle}>
          {assignments.length} {assignments.length === 1 ? 'class' : 'classes'} assigned
        </Text>
      </View>

      {assignments.length === 0 ? (
        <Card style={styles.emptyCard}>
          <BookOpen size={48} color={theme.colors.text.secondary} />
          <Text style={styles.emptyText}>No classes assigned yet</Text>
          <Text style={styles.emptySubtext}>
            Contact your administrator to get assigned to classes and subjects.
          </Text>
        </Card>
      ) : (
        assignments.map((group) => (
          <View key={group.class.id} style={styles.classGroup}>
            <View style={styles.classHeader}>
              <View style={styles.classIcon}>
                <GraduationCap size={20} color={theme.colors.text.inverse} />
              </View>
              <View style={styles.classInfo}>
                <Text style={styles.className}>{group.class.name}</Text>
                <View style={styles.classMeta}>
                  <Users size={14} color={theme.colors.text.secondary} />
                  <Text style={styles.studentCount}>
                    {studentCounts[group.class.id] || 0} {studentCounts[group.class.id] === 1 ? 'student' : 'students'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.subjectsContainer}>
              {group.subjects.map(({ subject, assignment }) => (
                <Pressable
                  key={`${group.class.id}-${subject.id}`}
                  onPress={() => handleClassPress(group.class.id, subject.id, group.class.name, subject.name)}
                >
                  <Card style={styles.subjectCard}>
                    <View style={styles.subjectContent}>
                      <View style={styles.subjectIcon}>
                        <BookOpen size={18} color={theme.colors.primary.base} />
                      </View>
                      <View style={styles.subjectInfo}>
                        <Text style={styles.subjectName}>{subject.name}</Text>
                        <Text style={styles.subjectCode}>{subject.code}</Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>

            {/* Remarks Button */}
            <Pressable
              onPress={() => {
                const currentYear = new Date().getFullYear();
                const defaultAcademicYear = `${currentYear}/${currentYear + 1}`;
                handleRemarksPress(group.class.id, group.class.name, group.subjects[0]?.assignment?.academic_year || defaultAcademicYear);
              }}
              style={styles.remarkButton}
            >
              <MessageSquare size={16} color={theme.colors.accent.base} />
              <Text style={styles.remarkButtonText}>Enter Remarks</Text>
            </Pressable>
          </View>
        ))
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
    header: {
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    emptyCard: {
      alignItems: 'center',
      padding: theme.spacing['2xl'],
    },
    emptyText: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.xs,
    },
    emptySubtext: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    classGroup: {
      marginBottom: theme.spacing.xl,
    },
    classHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.md,
    },
    classIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary.base,
      justifyContent: 'center',
      alignItems: 'center',
    },
    classInfo: {
      flex: 1,
    },
    className: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 2,
    },
    classMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs / 2,
    },
    studentCount: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    subjectsContainer: {
      gap: theme.spacing.md,
    },
    subjectCard: {
      marginBottom: 0,
      padding: theme.spacing.md,
      borderRadius: theme.roundness * 1.5,
      shadowColor: theme.colors.background.dark ?? '#000',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    subjectContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    subjectIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary.base + '1A',
      justifyContent: 'center',
      alignItems: 'center',
    },
    subjectInfo: {
      flex: 1,
    },
    subjectName: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 2,
    },
    subjectCode: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    remarkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.accent.base + '1A',
      borderRadius: theme.roundness,
      marginTop: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.accent.base + '40',
    },
    remarkButtonText: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.accent.base,
    },
  });

