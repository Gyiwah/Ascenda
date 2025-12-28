import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/utils/useAuth';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import {
  listPendingSubmissions,
  listApprovedSubmissions,
  listLockedSubmissions,
  AssessmentSubmission,
} from '@/api/headmaster/approvals';
import { Clock, CheckCircle, Lock, FileText, ChevronRight, Filter } from 'lucide-react-native';

type TabType = 'pending' | 'approved' | 'locked';

export default function ApprovalsDashboard() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [pendingSubmissions, setPendingSubmissions] = useState<AssessmentSubmission[]>([]);
  const [approvedSubmissions, setApprovedSubmissions] = useState<AssessmentSubmission[]>([]);
  const [lockedSubmissions, setLockedSubmissions] = useState<AssessmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const currentYear = new Date().getFullYear();
  const defaultAcademicYear = `${currentYear}/${currentYear + 1}`;
  const [academicYear, setAcademicYear] = useState<string>(defaultAcademicYear);
  const [term, setTerm] = useState<number | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      if (user?.school_id) {
        // Force reload all tabs when screen comes into focus (e.g., after approval)
        loadSubmissions(true);
      }
    }, [user?.school_id, activeTab, academicYear, term])
  );

  const loadSubmissions = async (forceAllTabs = false) => {
    if (!user?.school_id) return;

    setLoading(true);
    try {
      const currentYear = academicYear || defaultAcademicYear;

      // Load all tabs if forced (e.g., after approval) or just the active tab
      if (forceAllTabs || activeTab === 'pending') {
        const { data, error } = await listPendingSubmissions(user.school_id, currentYear, term);
        if (error) throw error;
        setPendingSubmissions(data || []);
      }
      
      if (forceAllTabs || activeTab === 'approved') {
        const { data, error } = await listApprovedSubmissions(user.school_id, currentYear, term);
        if (error) throw error;
        setApprovedSubmissions(data || []);
      }
      
      if (forceAllTabs || activeTab === 'locked') {
        const { data, error } = await listLockedSubmissions(user.school_id, currentYear, term);
        if (error) throw error;
        setLockedSubmissions(data || []);
      }
    } catch (err: any) {
      console.error('[ApprovalsDashboard] Error loading submissions:', err);
      showToast('Failed to load submissions', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSubmissions();
  };

  const handleSubmissionPress = (submission: AssessmentSubmission) => {
    navigation.navigate('ReviewAssessment', {
      classId: submission.class_id,
      subjectId: submission.subject_id,
      className: submission.class_name,
      subjectName: submission.subject_name,
      academicYear: submission.academic_year,
      term: submission.term,
      isLocked: submission.is_locked,
      isApproved: !!submission.approved_at,
    });
  };

  const currentSubmissions =
    activeTab === 'pending'
      ? pendingSubmissions
      : activeTab === 'approved'
      ? approvedSubmissions
      : lockedSubmissions;

  if (loading && currentSubmissions.length === 0) {
    return <Loader />;
  }

  const termOptions = [
    { label: 'All Terms', value: '' },
    { label: 'Term 1', value: '1' },
    { label: 'Term 2', value: '2' },
    { label: 'Term 3', value: '3' },
  ];

  return (
    <View style={styles.container}>
      {/* Filters */}
      <Card style={styles.filtersCard}>
        <View style={styles.filtersHeader}>
          <Filter size={18} color={theme.colors.text.secondary} />
          <Text style={styles.filtersTitle}>Filters</Text>
        </View>
        <View style={styles.filtersRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Academic Year</Text>
            <Input
              value={academicYear}
              onChangeText={setAcademicYear}
              keyboardType="numeric"
              style={styles.filterInput}
              placeholder="Year"
            />
          </View>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Term</Text>
            <Picker
              value={term?.toString() || ''}
              onValueChange={(value) => setTerm(value ? parseInt(value, 10) : undefined)}
              options={termOptions}
              style={styles.filterPicker}
            />
          </View>
        </View>
      </Card>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          onPress={() => setActiveTab('pending')}
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
        >
          <Clock
            size={18}
            color={activeTab === 'pending' ? theme.colors.primary.base : theme.colors.text.muted}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'pending' && styles.tabTextActive,
            ]}
          >
            Pending ({pendingSubmissions.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('approved')}
          style={[styles.tab, activeTab === 'approved' && styles.tabActive]}
        >
          <CheckCircle
            size={18}
            color={activeTab === 'approved' ? theme.colors.primary.base : theme.colors.text.muted}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'approved' && styles.tabTextActive,
            ]}
          >
            Approved ({approvedSubmissions.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('locked')}
          style={[styles.tab, activeTab === 'locked' && styles.tabActive]}
        >
          <Lock
            size={18}
            color={activeTab === 'locked' ? theme.colors.primary.base : theme.colors.text.muted}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'locked' && styles.tabTextActive,
            ]}
          >
            Locked ({lockedSubmissions.length})
          </Text>
        </Pressable>
      </View>

      {/* Submissions List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary.base}
          />
        }
      >
        {currentSubmissions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <FileText size={48} color={theme.colors.text.muted} />
            <Text style={styles.emptyText}>
              No {activeTab} submissions found
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'pending'
                ? 'Teachers will appear here once they submit assessments'
                : activeTab === 'approved'
                ? 'Approved assessments will appear here'
                : 'Locked assessments will appear here'}
            </Text>
          </Card>
        ) : (
          currentSubmissions.map((submission) => (
            <Pressable
              key={submission.id}
              onPress={() => handleSubmissionPress(submission)}
            >
              <Card style={styles.submissionCard}>
                <View style={styles.submissionHeader}>
                  <View style={styles.submissionIcon}>
                    <FileText size={20} color={theme.colors.primary.base} />
                  </View>
                  <View style={styles.submissionInfo}>
                    <Text style={styles.submissionTitle}>
                      {submission.class_name} - {submission.subject_name}
                    </Text>
                    <Text style={styles.submissionMeta}>
                      {submission.subject_code} • Term {submission.term} • {submission.academic_year}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={theme.colors.text.secondary} />
                </View>

                <View style={styles.submissionDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Teacher:</Text>
                    <Text style={styles.detailValue}>{submission.teacher_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Students:</Text>
                    <Text style={styles.detailValue}>{submission.student_count}</Text>
                  </View>
                  {submission.submitted_at && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Submitted:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                  {submission.approved_at && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Approved:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(submission.approved_at).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>

                {submission.is_locked && (
                  <View style={styles.lockedBadge}>
                    <Lock size={14} color={theme.colors.warn.base} />
                    <Text style={styles.lockedText}>Locked</Text>
                  </View>
                )}
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface.primary,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: theme.colors.primary.base,
    },
    tabText: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.colors.text.muted,
    },
    tabTextActive: {
      color: theme.colors.primary.base,
      fontWeight: theme.typography.fontWeights.semibold,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.spacing.lg,
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
    submissionCard: {
      marginBottom: theme.spacing.md,
      padding: theme.spacing.lg,
    },
    submissionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.md,
    },
    submissionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary.base + '1A',
      justifyContent: 'center',
      alignItems: 'center',
    },
    submissionInfo: {
      flex: 1,
    },
    submissionTitle: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 2,
    },
    submissionMeta: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    submissionDetails: {
      gap: theme.spacing.xs,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    detailLabel: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    detailValue: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.colors.text.primary,
    },
    lockedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs / 2,
      alignSelf: 'flex-start',
      marginTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs / 2,
      backgroundColor: theme.colors.warn.base + '1A',
      borderRadius: theme.roundness / 2,
    },
    lockedText: {
      fontSize: theme.typography.fontSizes.xs,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.warn.base,
    },
    filtersCard: {
      margin: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      padding: theme.spacing.md,
    },
    filtersHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.md,
    },
    filtersTitle: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    filtersRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    filterItem: {
      flex: 1,
    },
    filterLabel: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
      fontWeight: theme.typography.fontWeights.medium,
    },
    filterInput: {
      marginBottom: 0,
    },
    filterPicker: {
      marginBottom: 0,
    },
  });

