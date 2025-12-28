import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/hooks/useAuth';
import { schoolService } from '@/services/supabase/schools';
import { userService } from '@/services/supabase/users';
import { colors, spacing, typography } from '@/theme';
import { School, Users, FileText, Building2 } from 'lucide-react-native';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [schools, setSchools] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [schoolsResult, usersResult] = await Promise.all([
      schoolService.getAll(),
      userService.getAll(),
    ]);
    if (schoolsResult.data) setSchools(schoolsResult.data);
    if (usersResult.data) setUsers(usersResult.data);
    setLoading(false);
  };

  if (loading) return <Loader />;

  const stats = {
    schools: schools.length,
    users: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    teachers: users.filter((u) => u.role === 'teacher').length,
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Super Admin Dashboard</Text>
        <Text style={styles.subtitle}>Welcome, {user?.full_name}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={styles.statRow}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.primary[50] }]}>
                <School size={24} color={colors.primary[600]} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{stats.schools}</Text>
                <Text style={styles.statLabel}>Schools</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statRow}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.success[50] }]}>
                <Users size={24} color={colors.success[600]} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{stats.users}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statRow}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.warning[50] }]}>
                <Building2 size={24} color={colors.warning[600]} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{stats.admins}</Text>
                <Text style={styles.statLabel}>Admins</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statRow}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.secondary[50] }]}>
                <Users size={24} color={colors.secondary[600]} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{stats.teachers}</Text>
                <Text style={styles.statLabel}>Teachers</Text>
              </View>
            </View>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(superadmin)/schools')}
        >
          <School size={24} color={colors.primary[600]} />
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Manage Schools</Text>
            <Text style={styles.actionSubtitle}>Create, edit, and manage all schools</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(superadmin)/users')}
        >
          <Users size={24} color={colors.primary[600]} />
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Manage Users</Text>
            <Text style={styles.actionSubtitle}>View and manage users across all schools</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(superadmin)/audit-logs')}
        >
          <FileText size={24} color={colors.primary[600]} />
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Audit Logs</Text>
            <Text style={styles.actionSubtitle}>View system activity and audit trail</Text>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  statValue: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
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
