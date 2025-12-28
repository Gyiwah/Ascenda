import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/hooks/useAuth';
import { assessmentService } from '@/services/supabase/assessments';
import { colors, spacing, typography } from '@/theme';
import { BookOpen, ClipboardList, MessageSquare } from 'lucide-react-native';

export default function TeacherDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    if (!user?.id) return;

    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}/${currentYear + 1}`;

    const { data } = await assessmentService.getTeacherAssignments(
      user.id,
      academicYear
    );

    if (data) setAssignments(data);
    setLoading(false);
  };

  if (loading) return <Loader />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Teacher Dashboard</Text>
        <Text style={styles.subtitle}>Welcome, {user?.full_name}</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.statsCard}>
          <BookOpen size={28} color={colors.primary[600]} />
          <Text style={styles.statValue}>{assignments.length}</Text>
          <Text style={styles.statLabel}>Class Assignments</Text>
        </Card>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(teacher)/classes')}
        >
          <ClipboardList size={24} color={colors.primary[600]} />
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>My Classes</Text>
            <Text style={styles.actionSubtitle}>View assigned classes</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(teacher)/scores')}
        >
          <BookOpen size={24} color={colors.primary[600]} />
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Record Scores</Text>
            <Text style={styles.actionSubtitle}>Enter student assessments</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(teacher)/remarks')}
        >
          <MessageSquare size={24} color={colors.primary[600]} />
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Add Remarks</Text>
            <Text style={styles.actionSubtitle}>Write student remarks</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSizes.base,
    color: colors.text.inverse,
  },
  content: {
    padding: spacing.md,
  },
  statsCard: {
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statValue: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  actionCard: {
    backgroundColor: colors.background.light,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  actionSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
  },
});
