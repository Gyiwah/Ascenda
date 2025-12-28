import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { UserCheck, Edit2, Trash2, Plus, Users } from 'lucide-react-native';

import { useAuth } from '@/utils/useAuth';
import { teacherAssignmentService, TeacherAssignmentWithDetails } from '@/api/teacherAssignments';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';

const PAGE_SIZE = 10;

/**
 * TeacherAssignmentScreen - Manage teacher assignments
 * Displays list of teacher assignments with teacher, class, and subject details
 */
export default function TeacherAssignmentScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [assignments, setAssignments] = useState<TeacherAssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  useFocusEffect(
    React.useCallback(() => {
      loadAssignments();
    }, [user?.school_id])
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const filteredAssignments = useMemo(() => {
    if (!searchTerm.trim()) return assignments;
    const query = searchTerm.trim().toLowerCase();
    return assignments.filter((assignment) =>
      [
        assignment.teacher?.full_name,
        assignment.teacher?.email,
        assignment.class?.name,
        assignment.subject?.name,
        assignment.subject?.code,
        assignment.academic_year,
      ].some((value) => value?.toLowerCase().includes(query))
    );
  }, [assignments, searchTerm]);

  const visibleAssignments = useMemo(
    () => filteredAssignments.slice(0, page * PAGE_SIZE),
    [filteredAssignments, page]
  );

  const hasMore = visibleAssignments.length < filteredAssignments.length;

  const loadAssignments = async () => {
    if (!user?.school_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await teacherAssignmentService.getAll(user.school_id);
      if (error) throw error;
      setAssignments(data || []);
    } catch (err: any) {
      console.error('[TeacherAssignmentScreen] Error loading assignments:', err);
      showToast('Failed to load assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAssignments();
    setRefreshing(false);
  };

  const openCreate = () => {
    navigation.navigate('AssignTeacher');
  };

  const openEdit = (assignment: TeacherAssignmentWithDetails, e: any) => {
    e.stopPropagation();
    navigation.navigate('AssignTeacher', { assignmentId: assignment.id });
  };

  const handleDelete = (assignment: TeacherAssignmentWithDetails, e: any) => {
    e.stopPropagation();
    Alert.alert(
      'Delete Assignment',
      `Remove assignment: ${assignment.teacher?.full_name} → ${assignment.class?.name} (${assignment.subject?.name})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await teacherAssignmentService.delete(assignment.id);
              if (error) throw error;
              showToast('Assignment deleted', 'success');
              await loadAssignments();
            } catch (err: any) {
              console.error('[TeacherAssignmentScreen] Delete error:', err);
              showToast(err?.message || 'Delete failed', 'error');
            }
          },
        },
      ]
    );
  };

  if (loading && assignments.length === 0) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Input
          placeholder="Search assignments..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={styles.searchInput}
        />
        <Button
          title="Assign Teacher"
          onPress={openCreate}
          icon={<Plus size={18} color={theme.colors.text.inverse} />}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary.base} />
        }
      >
        {visibleAssignments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Users size={48} color={theme.colors.text.muted} />
            <Text style={styles.emptyText}>
              {searchTerm ? 'No assignments found' : 'No assignments yet'}
            </Text>
            {!searchTerm && (
              <Button title="Assign First Teacher" onPress={openCreate} style={styles.emptyButton} />
            )}
          </Card>
        ) : (
          visibleAssignments.map((assignment) => (
            <Pressable key={assignment.id} onPress={() => {}}>
              <Card style={styles.assignmentCard}>
                <View style={styles.assignmentHeader}>
                  <View style={styles.assignmentInfo}>
                    <View style={styles.assignmentIcon}>
                      <UserCheck size={20} color={theme.colors.primary.base} />
                    </View>
                    <View style={styles.assignmentDetails}>
                      <Text style={styles.teacherName}>{assignment.teacher?.full_name || 'Unknown'}</Text>
                      <Text style={styles.assignmentMeta}>
                        {assignment.class?.name || 'Unknown Class'} • {assignment.subject?.name || 'Unknown Subject'}
                      </Text>
                      <Text style={styles.assignmentYear}>{assignment.academic_year}</Text>
                    </View>
                  </View>
                  <View style={styles.assignmentActions}>
                    <Pressable
                      style={styles.actionButton}
                      onPress={(e) => openEdit(assignment, e)}
                    >
                      <Edit2 size={18} color={theme.colors.primary.base} />
                    </Pressable>
                    <Pressable
                      style={styles.actionButton}
                      onPress={(e) => handleDelete(assignment, e)}
                    >
                      <Trash2 size={18} color={theme.colors.error.base} />
                    </Pressable>
                  </View>
                </View>
              </Card>
            </Pressable>
          ))
        )}

        {hasMore && (
          <Button
            title="Load More"
            onPress={() => setPage((p) => p + 1)}
            variant="ghost"
            style={styles.loadMoreButton}
          />
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme> | any) => {
  const safeTheme = theme || {
    colors: {
      background: { primary: '#ffffff' },
      surface: { primary: '#ffffff' },
      text: { primary: '#000000', secondary: '#666666' },
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16 },
    typography: { fontSizes: { xs: 12, sm: 14, base: 16, lg: 18, '2xl': 24, '3xl': 30 }, fontWeights: { medium: '500', semibold: '600', bold: '700' } },
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: safeTheme.colors.background.primary,
    },

    header: {
      padding: theme.spacing.lg,
      backgroundColor: safeTheme.colors.surface.primary,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: theme.spacing.md,
    },
    searchInput: {
      marginBottom: 0,
      backgroundColor: safeTheme.colors.background.primary,
      color: safeTheme.colors.text.primary,
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
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    emptyButton: {
      marginTop: theme.spacing.md,
    },
    assignmentCard: {
      marginBottom: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: safeTheme.colors.surface.primary,
    },
    assignmentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    assignmentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    assignmentIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary.base + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    assignmentDetails: {
      flex: 1,
    },
    teacherName: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 2,
    },
    assignmentMeta: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs / 2,
    },
    assignmentYear: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.muted,
    },
    assignmentActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    actionButton: {
      padding: theme.spacing.sm,
      borderRadius: theme.roundness,
    },
    loadMoreButton: {
      marginTop: theme.spacing.md,
    },
  });
}
