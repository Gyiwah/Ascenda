import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/hooks/useAuth';
import { studentService } from '@/services/supabase/students';
import { userService } from '@/services/supabase/users';
import { colors, spacing, typography } from '@/theme';
import { Users, GraduationCap, BookOpen } from 'lucide-react-native';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, teachers: 0 });
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadStats();
  }, [user?.school_id]);

  const loadStats = async () => {
    if (!user?.school_id) return;

    const [studentsResult, teachersResult] = await Promise.all([
      studentService.getAll(user.school_id),
      userService.getByRole('teacher', user.school_id),
    ]);

    setStats({
      students: studentsResult.data?.length || 0,
      teachers: teachersResult.data?.length || 0,
    });
    setLoading(false);
  };

  if (loading) return <Loader />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Welcome, {user?.full_name}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <GraduationCap size={28} color={colors.primary[600]} />
            <Text style={styles.statValue}>{stats.students}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </Card>

          <Card style={styles.statCard}>
            <Users size={28} color={colors.success[600]} />
            <Text style={styles.statValue}>{stats.teachers}</Text>
            <Text style={styles.statLabel}>Teachers</Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(admin)/users')}
        >
          <Users size={24} color={colors.primary[600]} />
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Manage Users</Text>
            <Text style={styles.actionSubtitle}>Add and manage staff</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(admin)/classes')}
        >
          <BookOpen size={24} color={colors.primary[600]} />
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Manage Classes</Text>
            <Text style={styles.actionSubtitle}>Configure classes and subjects</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(admin)/students')}
        >
          <GraduationCap size={24} color={colors.primary[600]} />
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Manage Students</Text>
            <Text style={styles.actionSubtitle}>Add and manage students</Text>
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
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
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
