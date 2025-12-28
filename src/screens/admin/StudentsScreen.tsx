import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { GraduationCap, Edit2, Trash2, Plus, UserMinus, Hash, User } from 'lucide-react-native';

import { useAuth } from '@/utils/useAuth';
import { studentService } from '@/api/students';
import { classService } from '@/api/classes';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { Student, Class } from '@/types/database';

const PAGE_SIZE = 10;

/**
 * StudentsScreen - Manage students for the school
 * Allows selecting a class and managing students in that class
 */
export default function StudentsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  useFocusEffect(
    React.useCallback(() => {
      loadClasses();
    }, [user?.school_id])
  );

  useEffect(() => {
    if (selectedClassId) {
      loadStudents();
    } else {
      setStudents([]);
    }
    setPage(1);
  }, [selectedClassId, user?.school_id]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const loadClasses = async () => {
    if (!user?.school_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await classService.getAll(user.school_id);
      if (error) throw error;
      setClasses(data || []);
      if (data && data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      }
    } catch (err: any) {
      console.error('[StudentsScreen] Error loading classes:', err);
      showToast('Failed to load classes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    if (!user?.school_id || !selectedClassId) return;
    
    setLoading(true);
    try {
      // If "All Classes" is selected (value 'all'), don't filter by class
      const classIdFilter = selectedClassId === 'all' ? undefined : selectedClassId;
      const { data, error } = await studentService.getAll(user.school_id, classIdFilter);
      if (error) throw error;
      setStudents(data || []);
    } catch (err: any) {
      console.error('[StudentsScreen] Error loading students:', err);
      showToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
  };

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const query = searchTerm.trim().toLowerCase();
    return students.filter((student) =>
      [
        student.first_name,
        student.last_name,
        student.admission_number,
      ].some((value) => value?.toLowerCase().includes(query))
    );
  }, [students, searchTerm]);

  const visibleStudents = useMemo(
    () => filteredStudents.slice(0, page * PAGE_SIZE),
    [filteredStudents, page]
  );

  const hasMore = visibleStudents.length < filteredStudents.length;

  const openCreate = () => {
    if (!selectedClassId || selectedClassId === 'all') {
      showToast('Please select a specific class first', 'warning');
      return;
    }
    // Use getParent to navigate to the stack navigator
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('AddStudent', { classId: selectedClassId });
    } else {
      navigation.navigate('AddStudent', { classId: selectedClassId });
    }
  };

  const openEdit = (student: Student, e: any) => {
    e.stopPropagation();
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('AddStudent', { studentId: student.id, classId: selectedClassId });
    } else {
      navigation.navigate('AddStudent', { studentId: student.id, classId: selectedClassId });
    }
  };

  const handleRemoveFromClass = (student: Student, e: any) => {
    e.stopPropagation();
    Alert.alert(
      'Remove from Class',
      `Remove "${student.first_name} ${student.last_name}" from this class? The student will be deactivated.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Soft delete by setting is_active to false
              const { error } = await studentService.update(student.id, { is_active: false });
              if (error) throw error;
              showToast('Student removed from class', 'success');
              await loadStudents();
            } catch (err: any) {
              console.error('[StudentsScreen] Remove error:', err);
              showToast(err?.message || 'Remove failed', 'error');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (student: Student, e: any) => {
    e.stopPropagation();
    Alert.alert('Delete Student', `Delete "${student.first_name} ${student.last_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await studentService.delete(student.id);
            if (error) throw error;
            showToast('Student deleted', 'success');
            await loadStudents();
          } catch (err: any) {
            console.error('[StudentsScreen] Delete error:', err);
            showToast(err?.message || 'Delete failed', 'error');
          }
        },
      },
    ]);
  };

  const classOptions = [
    { label: 'All Classes', value: 'all' },
    ...classes.map((c) => ({
      label: `${c.name} (${c.academic_year})`,
      value: c.id,
    })),
  ];

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  if (loading && classes.length === 0) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Picker
          label="Select Class"
          value={selectedClassId}
          onValueChange={setSelectedClassId}
          options={classOptions}
          placeholder="Select a class"
        />
        {selectedClassId && (
          <Button
            title="Add Student"
            onPress={openCreate}
            icon={<Plus size={18} color={theme.colors.text.inverse} />}
            style={styles.addButton}
          />
        )}
        {selectedClassId && (
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.searchInput}
          />
        )}
      </View>

      {selectedClassId ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary.base} />
          }
        >
          {visibleStudents.length === 0 ? (
            <Card style={styles.emptyCard}>
              <GraduationCap size={48} color={theme.colors.text.secondary} />
              <Text style={styles.emptyText}>
                {searchTerm ? 'No students found' : `No students in ${selectedClass?.name || 'this class'}`}
              </Text>
              {!searchTerm && (
                <Button title="Add First Student" onPress={openCreate} style={styles.emptyButton} />
              )}
            </Card>
          ) : (
            visibleStudents.map((student) => (
              <Pressable
                key={student.id}
                onPress={() => {
                  const parent = navigation.getParent();
                  if (parent) {
                    parent.navigate('StudentDetails', { studentId: student.id });
                  } else {
                    navigation.navigate('StudentDetails', { studentId: student.id });
                  }
                }}
              >
                <Card style={styles.studentCard}>
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <View style={styles.studentIcon}>
                        <GraduationCap size={20} color={theme.colors.text.inverse} />
                      </View>
                      <View style={styles.studentDetails}>
                        <Text style={styles.studentName}>
                          {student.first_name} {student.last_name}
                        </Text>
                        <View style={styles.studentMetaRow}>
                          <Hash size={14} color={theme.colors.text.secondary} />
                          <Text style={styles.studentMeta}>{student.admission_number}</Text>
                        </View>
                        {student.gender && (
                          <View style={styles.studentMetaRow}>
                            <User size={14} color={theme.colors.text.secondary} />
                            <Text style={styles.studentMeta}>{student.gender}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.cardActions}>
                      <Pressable
                        style={styles.actionButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          openEdit(student, e);
                        }}
                      >
                        <Edit2 size={18} color={theme.colors.primary.base} />
                        <Text style={styles.actionButtonText}>Edit</Text>
                      </Pressable>
                      <View style={styles.actionDivider} />
                      <Pressable
                        style={[styles.actionButton, styles.actionButtonWarning]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemoveFromClass(student, e);
                        }}
                      >
                        <UserMinus size={18} color={theme.colors.warn.base} />
                        <Text style={[styles.actionButtonText, styles.actionButtonTextWarning]}>Remove</Text>
                      </Pressable>
                      <View style={styles.actionDivider} />
                      <Pressable
                        style={[styles.actionButton, styles.actionButtonDanger]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(student, e);
                        }}
                      >
                        <Trash2 size={18} color={theme.colors.error.base} />
                        <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>Delete</Text>
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
      ) : (
        <View style={styles.emptyState}>
          <Card style={styles.emptyCard}>
            <GraduationCap size={48} color={theme.colors.text.secondary} />
            <Text style={styles.emptyText}>Please select a class to view students</Text>
          </Card>
        </View>
      )}
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
    addButton: {
      marginTop: theme.spacing.sm,
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
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
      textAlign: 'center',
    },
    emptyButton: {
      marginTop: theme.spacing.md,
    },
    studentCard: {
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
    studentIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary.base,
      justifyContent: 'center',
      alignItems: 'center',
    },
    studentDetails: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    studentName: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    studentMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs / 2,
    },
    studentMeta: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
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
    actionButtonWarning: {
      backgroundColor: theme.colors.warn.base + '0F',
    },
    actionButtonDanger: {
      backgroundColor: theme.colors.error.base + '0F',
    },
    actionButtonText: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.colors.primary.base,
    },
    actionButtonTextWarning: {
      color: theme.colors.warn.base,
    },
    actionButtonTextDanger: {
      color: theme.colors.error.base,
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

