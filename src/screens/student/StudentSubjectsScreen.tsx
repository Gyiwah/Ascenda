import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/utils/useAuth';
import { studentApiService, StudentScoreItem } from '@/api/student';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { StudentUser } from '@/types/database';
import { BookOpen, Award, CheckCircle2 } from 'lucide-react-native';

export default function StudentSubjectsScreen() {
  const { user } = useAuth();
  const theme = useAppTheme();
  const { showToast } = useToast();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const student = user as StudentUser | null;
  const [scores, setScores] = useState<StudentScoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadScores();
  }, [student?.id, student?.class_id]);

  const loadScores = async () => {
    if (!student?.id || !student?.class_id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await studentApiService.getStudentScores(
        student.id,
        student.class_id
      );
      if (error) {
        showToast('Failed to load subject scores', 'error');
      } else {
        setScores(data || []);
      }
    } catch (err: any) {
      showToast('Error loading scores', 'error');
    } finally {
      setLoading(false);
    }
  };

  const overallAverage = useMemo(() => {
    if (scores.length === 0) return 0;
    const total = scores.reduce((sum, s) => sum + s.total_score, 0);
    return Math.round(total / scores.length);
  }, [scores]);

  if (loading && scores.length === 0) {
    return <Loader />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await loadScores();
            setRefreshing(false);
          }}
          tintColor={theme.colors.primary.base}
        />
      }
    >
      {/* Header Summary */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{scores.length}</Text>
            <Text style={styles.summaryLabel}>Subjects Enrolled</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.colors.primary.base }]}>
              {overallAverage}%
            </Text>
            <Text style={styles.summaryLabel}>Overall Average</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Enrolled Subjects & Scores</Text>

      {scores.length === 0 ? (
        <EmptyState
          title="No scores available"
          message="Assessment scores have not been recorded or published yet for this term."
        />
      ) : (
        scores.map((item) => (
          <Card key={item.id || item.subject_id} style={styles.scoreCard}>
            <View style={styles.cardHeader}>
              <View style={styles.subjectInfo}>
                <BookOpen size={20} color={theme.colors.primary.base} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.subjectName}>{item.subject_name}</Text>
                  {!!item.subject_code && (
                    <Text style={styles.subjectCode}>{item.subject_code}</Text>
                  )}
                </View>
              </View>
              <View style={[styles.gradeBadge, { backgroundColor: theme.colors.primary.base + '1A' }]}>
                <Text style={[styles.gradeText, { color: theme.colors.primary.base }]}>
                  Grade {item.grade}
                </Text>
              </View>
            </View>

            <View style={styles.scoresGrid}>
              <View style={styles.gridBox}>
                <Text style={styles.gridLabel}>Class Score (30%)</Text>
                <Text style={styles.gridValue}>{item.class_score}</Text>
              </View>
              <View style={styles.gridBox}>
                <Text style={styles.gridLabel}>Exam Score (70%)</Text>
                <Text style={styles.gridValue}>{item.exam_score}</Text>
              </View>
              <View style={[styles.gridBox, { backgroundColor: theme.colors.background.secondary }]}>
                <Text style={styles.gridLabel}>Total (100%)</Text>
                <Text style={[styles.gridValue, { fontWeight: theme.typography.fontWeights.bold }]}>
                  {item.total_score}
                </Text>
              </View>
            </View>

            {!!item.remarks && (
              <View style={styles.remarksRow}>
                <CheckCircle2 size={14} color={theme.colors.success.base} />
                <Text style={styles.remarksText}>{item.remarks}</Text>
              </View>
            )}
          </Card>
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
      gap: theme.spacing.md,
    },
    summaryCard: {
      padding: theme.spacing.md,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    summaryItem: {
      alignItems: 'center',
      flex: 1,
    },
    divider: {
      width: 1,
      height: 40,
      backgroundColor: theme.colors.divider,
    },
    summaryValue: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
    },
    summaryLabel: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
      marginTop: 2,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginTop: theme.spacing.xs,
    },
    scoreCard: {
      padding: theme.spacing.md,
      gap: theme.spacing.md,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    subjectInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flex: 1,
    },
    subjectName: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    subjectCode: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.muted,
    },
    gradeBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.radii.full,
    },
    gradeText: {
      fontSize: theme.typography.fontSizes.xs,
      fontWeight: theme.typography.fontWeights.bold,
    },
    scoresGrid: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    gridBox: {
      flex: 1,
      padding: theme.spacing.sm,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    gridLabel: {
      fontSize: 10,
      color: theme.colors.text.muted,
      marginBottom: 2,
      textAlign: 'center',
    },
    gridValue: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.primary,
    },
    remarksRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingTop: theme.spacing.xs,
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
    },

    remarksText: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
      fontStyle: 'italic',
    },
  });
