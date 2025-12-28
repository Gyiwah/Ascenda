import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/utils/useAuth';
import { schoolService } from '@/api/schools';
import { userService } from '@/api/users';
import { useFetchMultiple } from '@/hooks/useFetchData';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Building2, Users, UserCheck, UserX, GraduationCap, Shield } from 'lucide-react-native';
import { useAppTheme } from '@/theme/@ThemeProvider';

export default function SuperAdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    schools: 0,
    totalUsers: 0,
    admins: 0,
    headmasters: 0,
    teachers: 0,
    students: 0,
    activeUsers: 0,
    inactiveUsers: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Use fetch hook for automatic refresh on screen focus and manual refresh
  const { loading, refresh } = useFetchMultiple({
    schools: () => schoolService.getAll(),
    users: () => userService.getAll(),
    admins: () => userService.getByRole('admin'),
    headmasters: () => userService.getByRole('headmaster'),
    teachers: () => userService.getByRole('teacher'),
    students: () => userService.getByRole('student'),
  });

  // Update stats whenever data changes
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [schoolsResult, usersResult, adminsResult, headmastersResult, teachersResult, studentsResult] = await Promise.all([
        schoolService.getAll(),
        userService.getAll(),
        userService.getByRole('admin'),
        userService.getByRole('headmaster'),
        userService.getByRole('teacher'),
        userService.getByRole('student'),
      ]);

      const allUsers = usersResult.data || [];
      const activeUsers = allUsers.filter((u: any) => u.is_active).length;
      const inactiveUsers = allUsers.length - activeUsers;

      setStats({
        schools: schoolsResult.data?.length || 0,
        totalUsers: allUsers.length,
        admins: adminsResult.data?.length || 0,
        headmasters: headmastersResult.data?.length || 0,
        teachers: teachersResult.data?.length || 0,
        students: studentsResult.data?.length || 0,
        activeUsers,
        inactiveUsers,
      });
    } catch (error) {
      console.error('[Dashboard] Error loading stats:', error);
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
      await loadStats();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !stats.schools) return <Loader />;

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
        <Text style={styles.title}>Super Admin Dashboard</Text>
        <Text style={styles.subtitle}>Welcome, {user?.full_name}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsRow}>
          <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('Schools')}>
            <Card style={styles.statCard}>
              <Building2 size={28} color={theme.colors.primary.base} />
              <Text style={styles.statValue}>{stats.schools}</Text>
              <Text style={styles.statLabel}>Schools</Text>
            </Card>
          </Pressable>

          <View style={{ width: theme.spacing.sm }} />

          <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('Users')}>
            <Card style={styles.statCard}>
              <Users size={28} color={theme.colors.accent.base} />
              <Text style={styles.statValue}>{stats.totalUsers}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </Card>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Users by Role</Text>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Shield size={24} color={theme.colors.primary.base} />
            <Text style={styles.statValue}>{stats.admins}</Text>
            <Text style={styles.statLabel}>Admins</Text>
          </Card>

          <Card style={styles.statCard}>
            <UserCheck size={24} color={theme.colors.accent.base} />
            <Text style={styles.statValue}>{stats.headmasters}</Text>
            <Text style={styles.statLabel}>Headmasters</Text>
          </Card>
        </View>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <GraduationCap size={24} color={theme.colors.warn.base} />
            <Text style={styles.statValue}>{stats.teachers}</Text>
            <Text style={styles.statLabel}>Teachers</Text>
          </Card>

          <Card style={styles.statCard}>
            <Users size={24} color={theme.colors.accent.base} />
            <Text style={styles.statValue}>{stats.students}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>User Status</Text>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <UserCheck size={24} color="#10b981" />
            <Text style={styles.statValue}>{stats.activeUsers}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </Card>

          <Card style={styles.statCard}>
            <UserX size={24} color={theme.colors.error.base} />
            <Text style={styles.statValue}>{stats.inactiveUsers}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </Card>
        </View>
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
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface.primary,
    },
    title: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.secondary,
    },
    content: {
      padding: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    statCard: {
      flex: 1,
      alignItems: 'center',
      marginHorizontal: theme.spacing.xs,
      padding: theme.spacing.lg,
    },
    statValue: {
      fontSize: theme.typography.fontSizes['3xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginTop: theme.spacing.sm,
    },
    statLabel: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs,
    },
  });

