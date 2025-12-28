import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Users, Edit2, Trash2, Plus, UserCheck, UserX, Mail } from 'lucide-react-native';

import { useAuth } from '@/utils/useAuth';
import { userService } from '@/api/users';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { User } from '@/types/database';

const PAGE_SIZE = 10;

/**
 * TeachersScreen - Manage teachers for the school
 * Displays list of teachers with CRUD operations
 */
export default function TeachersScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  useFocusEffect(
    React.useCallback(() => {
      loadTeachers();
    }, [user?.school_id])
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const filteredTeachers = useMemo(() => {
    if (!searchTerm.trim()) return teachers;
    const query = searchTerm.trim().toLowerCase();
    return teachers.filter((teacher) =>
      [teacher.full_name, teacher.email].some((value) => value?.toLowerCase().includes(query))
    );
  }, [teachers, searchTerm]);

  const visibleTeachers = useMemo(
    () => filteredTeachers.slice(0, page * PAGE_SIZE),
    [filteredTeachers, page]
  );

  const hasMore = visibleTeachers.length < filteredTeachers.length;

  const loadTeachers = async () => {
    if (!user?.school_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await userService.getByRole('teacher', user.school_id);
      if (error) throw error;
      setTeachers(data || []);
    } catch (err: any) {
      console.error('[TeachersScreen] Error loading teachers:', err);
      showToast('Failed to load teachers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTeachers();
    setRefreshing(false);
  };

  const openCreate = () => {
    navigation.navigate('AddTeacher');
  };

  const openEdit = (teacher: User, e: any) => {
    e.stopPropagation();
    navigation.navigate('AddTeacher', { userId: teacher.id });
  };

  const handleToggleActive = (teacher: User, e: any) => {
    e.stopPropagation();
    Alert.alert(
      teacher.is_active ? 'Deactivate Teacher' : 'Activate Teacher',
      `${teacher.is_active ? 'Deactivate' : 'Activate'} "${teacher.full_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: teacher.is_active ? 'Deactivate' : 'Activate',
          style: teacher.is_active ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const { error } = await userService.update(teacher.id, { is_active: !teacher.is_active });
              if (error) throw error;
              showToast(`Teacher ${teacher.is_active ? 'deactivated' : 'activated'}`, 'success');
              await loadTeachers();
            } catch (err: any) {
              console.error('[TeachersScreen] Toggle active error:', err);
              showToast(err?.message || 'Operation failed', 'error');
            }
          },
        },
      ]
    );
  };

  if (loading && teachers.length === 0) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Input
          placeholder="Search teachers..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={styles.searchInput}
        />
        <Button
          title="Add Teacher"
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
        {visibleTeachers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Users size={48} color={theme.colors.text.secondary} />
            <Text style={styles.emptyText}>
              {searchTerm ? 'No teachers found' : 'No teachers yet'}
            </Text>
            {!searchTerm && (
              <Button title="Add First Teacher" onPress={openCreate} style={styles.emptyButton} />
            )}
          </Card>
        ) : (
          visibleTeachers.map((teacher) => (
            <Pressable key={teacher.id} onPress={() => {}}>
              <Card style={styles.teacherCard}>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.teacherIcon}>
                      <Users size={20} color={theme.colors.text.inverse} />
                    </View>
                    <View style={styles.teacherDetails}>
                      <Text style={styles.teacherName}>{teacher.full_name}</Text>
                      <View style={styles.teacherMetaRow}>
                        <Mail size={14} color={theme.colors.text.secondary} />
                        <Text style={styles.teacherEmail}>{teacher.email}</Text>
                      </View>
                      <View style={styles.statusRow}>
                        {teacher.is_active ? (
                          <UserCheck size={14} color={theme.colors.success[500]} />
                        ) : (
                          <UserX size={14} color={theme.colors.error.base} />
                        )}
                        <Text style={[styles.statusText, !teacher.is_active && styles.statusInactive]}>
                          {teacher.is_active ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <Pressable
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        openEdit(teacher, e);
                      }}
                    >
                      <Edit2 size={18} color={theme.colors.primary.base} />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </Pressable>
                    <View style={styles.actionDivider} />
                    <Pressable
                      style={[styles.actionButton, styles.actionButtonDanger]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleToggleActive(teacher, e);
                      }}
                    >
                          {teacher.is_active ? (
                        <>
                          <UserX size={18} color={theme.colors.error.base} />
                          <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>Deactivate</Text>
                        </>
                      ) : (
                        <>
                          <UserCheck size={18} color={theme.colors.success[500]} />
                          <Text style={[styles.actionButtonText, styles.actionButtonTextSuccess]}>Activate</Text>
                        </>
                      )}
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

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface.primary,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: theme.spacing.md,
    },
    searchInput: {
      marginBottom: 0,
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
    teacherCard: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.roundness,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.background.dark ?? '#000',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    cardContent: {
      gap: theme.spacing.md,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
    },
    teacherIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary.base,
      justifyContent: 'center',
      alignItems: 'center',
    },
    teacherDetails: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    teacherName: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    teacherMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs / 2,
    },
    teacherEmail: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs / 2,
      marginTop: theme.spacing.xs / 2,
    },
    statusText: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.success[500],
    },
    statusInactive: {
      color: theme.colors.error.base,
    },
    cardActions: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
      gap: theme.spacing.sm,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.roundness / 2,
      backgroundColor: theme.colors.primary.base + '0F',
    },
    actionButtonDanger: {
      backgroundColor: theme.colors.error.base + '0F',
    },
    actionButtonText: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.colors.primary.base,
    },
    actionButtonTextDanger: {
      color: theme.colors.error.base,
    },
    actionButtonTextSuccess: {
      color: theme.colors.success[500],
    },
    actionDivider: {
      width: 1,
      height: 20,
      backgroundColor: theme.colors.divider,
    },
    loadMoreButton: {
      marginTop: theme.spacing.md,
    },
  });

