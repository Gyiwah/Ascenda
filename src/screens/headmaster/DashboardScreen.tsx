import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/utils/useAuth';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import {
  listPendingSubmissions,
  listApprovedSubmissions,
  listLockedSubmissions,
} from '@/api/headmaster/approvals';
import {
  FileText,
  CheckCircle,
  Clock,
  Lock,
  GraduationCap,
  TrendingUp,
  Users,
} from 'lucide-react-native';
import { schoolService } from '@/api/schools';
import { classService } from '@/api/classes';
import { studentService } from '@/api/students';

interface DashboardStats {
  pendingSubmissions: number;
  approvedSubmissions: number;
  lockedSubmissions: number;
  totalClasses: number;
  totalStudents: number;
}

export default function HeadmasterDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const [stats, setStats] = useState<DashboardStats>({
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    lockedSubmissions: 0,
    totalClasses: 0,
    totalStudents: 0,
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
    if (!user?.school_id) {
      setLoading(false);
      return;
    }

    try {
      const currentYear = new Date().getFullYear();
      const defaultAcademicYear = `${currentYear}/${currentYear + 1}`;

      const [pendingRes, approvedRes, lockedRes, schoolResult, classesRes, studentsRes] = await Promise.all([
        listPendingSubmissions(user.school_id, defaultAcademicYear),
        listApprovedSubmissions(user.school_id, defaultAcademicYear),
        listLockedSubmissions(user.school_id, defaultAcademicYear),
        schoolService.getById(user.school_id),
        classService.getAll(user.school_id, defaultAcademicYear),
        studentService.getAll(user.school_id),
      ]);

      setStats({
        pendingSubmissions: pendingRes.data?.length || 0,
        approvedSubmissions: approvedRes.data?.length || 0,
        lockedSubmissions: lockedRes.data?.length || 0,
        totalClasses: classesRes.data?.length || 0,
        totalStudents: studentsRes.data?.length || 0,
      });

      if (schoolResult.data) {
        setSchoolName(schoolResult.data.name);
      }
    } catch (error: any) {
      console.error('[HeadmasterDashboard] Error loading stats:', error);
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

  const navigateToApprovals = () => {
    navigation.navigate('Approvals');
  };

  const navigateToPromotions = () => {
    navigation.navigate('Promotions');
  };

  if (loading) return <Loader />;

  const approvalRate =
    stats.approvedSubmissions + stats.pendingSubmissions > 0
      ? Math.round(
          (stats.approvedSubmissions /
            (stats.approvedSubmissions + stats.pendingSubmissions)) *
            100
        )
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
          <Text style={styles.title}>{schoolName || 'Headmaster Dashboard'}</Text>
          <Text style={styles.subtitle}>Welcome, {user?.full_name}</Text>
        </View>
        <View style={styles.roleBadge}>
          <GraduationCap size={16} color={theme.colors.primary.base} />
          <Text style={styles.roleText}>Headmaster</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Quick Stats Row */}
        <View style={styles.quickStatsRow}>
          <Pressable onPress={navigateToApprovals} style={styles.quickStatCard}>
            <Clock size={24} color={theme.colors.error.base} />
            <Text style={styles.quickStatValue}>{stats.pendingSubmissions}</Text>
            <Text style={styles.quickStatLabel}>Pending</Text>
          </Pressable>

          <Pressable onPress={navigateToApprovals} style={styles.quickStatCard}>
            <CheckCircle size={24} color="#10b981" />
            <Text style={styles.quickStatValue}>{stats.approvedSubmissions}</Text>
            <Text style={styles.quickStatLabel}>Approved</Text>
          </Pressable>

          <Pressable onPress={navigateToApprovals} style={styles.quickStatCard}>
            <Lock size={24} color={theme.colors.warn.base} />
            <Text style={styles.quickStatValue}>{stats.lockedSubmissions}</Text>
            <Text style={styles.quickStatLabel}>Locked</Text>
          </Pressable>
        </View>

        {/* Approval Stats Card */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Approval Overview</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.colors.error.base + '1A' }]}>
                <Clock size={20} color={theme.colors.error.base} />
              </View>
              <Text style={styles.statValue}>{stats.pendingSubmissions}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#10b9811A' }]}>
                <CheckCircle size={20} color="#10b981" />
              </View>
              <Text style={styles.statValue}>{stats.approvedSubmissions}</Text>
              <Text style={styles.statLabel}>Approved</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary.base + '1A' }]}>
                <TrendingUp size={20} color={theme.colors.primary.base} />
              </View>
              <Text style={styles.statValue}>{approvalRate}%</Text>
              <Text style={styles.statLabel}>Rate</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Pressable onPress={navigateToApprovals} style={styles.actionButton}>
            <View style={styles.actionContent}>
              <CheckCircle size={20} color={theme.colors.primary.base} />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Review & Approve</Text>
                <Text style={styles.actionSubtitle}>Review teacher submissions and approve assessments</Text>
              </View>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </Pressable>

          <Pressable onPress={navigateToPromotions} style={styles.actionButton}>
            <View style={styles.actionContent}>
              <GraduationCap size={20} color={theme.colors.accent.base} />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Student Promotions</Text>
                <Text style={styles.actionSubtitle}>Manage student promotions and class transfers</Text>
              </View>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </Pressable>
        </Card>

        {/* School Statistics */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>School Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.colors.accent.base + '1A' }]}>
                <GraduationCap size={20} color={theme.colors.accent.base} />
              </View>
              <Text style={styles.statValue}>{stats.totalClasses}</Text>
              <Text style={styles.statLabel}>Classes</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary.base + '1A' }]}>
                <Users size={20} color={theme.colors.primary.base} />
              </View>
              <Text style={styles.statValue}>{stats.totalStudents}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
          </View>
        </Card>

        {/* Summary Info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <FileText size={18} color={theme.colors.text.secondary} />
            <Text style={styles.infoText}>
              {stats.pendingSubmissions} submission{stats.pendingSubmissions !== 1 ? 's' : ''} awaiting your review
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
      marginBottom: theme.spacing.md,
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
