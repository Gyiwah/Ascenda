import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BookOpen, Edit2, Trash2, Plus, Hash } from 'lucide-react-native';

import { useAuth } from '@/utils/useAuth';
import { subjectService } from '@/api/subjects';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { Subject } from '@/types/database';

const PAGE_SIZE = 10;

// Note: subject chip colors are derived from the active theme inside the component

/**
 * SubjectsScreen - Manage subjects for the school
 * Displays list of subjects with color-coded chips and CRUD operations
 */
export default function SubjectsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  // derive subject palette from theme tokens so colors adapt to light/dark
  const SUBJECT_COLORS = [
    theme.colors.primary.base,
    theme.colors.accent.base,
    theme.colors.primary.dark ?? theme.colors.primary.base,
    (theme.colors.success && (theme.colors.success[500] || theme.colors.success.base)) || theme.colors.primary.base,
    theme.colors.accent.light ?? theme.colors.accent.base,
    theme.colors.warn.base,
    theme.colors.error.base,
    theme.colors.primary.light ?? theme.colors.primary.base,
    theme.colors.secondary?.[500] ?? theme.colors.text.secondary,
    theme.colors.text.secondary,
  ];
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  useFocusEffect(
    React.useCallback(() => {
      loadSubjects();
    }, [user?.school_id])
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const filteredSubjects = useMemo(() => {
    if (!searchTerm.trim()) return subjects;
    const query = searchTerm.trim().toLowerCase();
    return subjects.filter((subject) =>
      [subject.name, subject.code].some((value) => value?.toLowerCase().includes(query))
    );
  }, [subjects, searchTerm]);

  const visibleSubjects = useMemo(
    () => filteredSubjects.slice(0, page * PAGE_SIZE),
    [filteredSubjects, page]
  );

  const hasMore = visibleSubjects.length < filteredSubjects.length;

  // Get color for subject chip based on index
  const getSubjectColor = (index: number) => SUBJECT_COLORS[index % SUBJECT_COLORS.length];

  const loadSubjects = async () => {
    if (!user?.school_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await subjectService.getAll(user.school_id);
      if (error) throw error;
      setSubjects(data || []);
    } catch (err: any) {
      console.error('[SubjectsScreen] Error loading subjects:', err);
      showToast('Failed to load subjects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSubjects();
    setRefreshing(false);
  };

  const openCreate = () => {
    navigation.navigate('AddSubject');
  };

  const openEdit = (subject: Subject, e: any) => {
    e.stopPropagation();
    navigation.navigate('AddSubject', { subjectId: subject.id });
  };

  const handleDelete = (subject: Subject, e: any) => {
    e.stopPropagation();
    Alert.alert('Delete Subject', `Delete "${subject.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await subjectService.delete(subject.id);
            if (error) throw error;
            showToast('Subject deleted', 'success');
            await loadSubjects();
          } catch (err: any) {
            console.error('[SubjectsScreen] Delete error:', err);
            showToast(err?.message || 'Delete failed', 'error');
          }
        },
      },
    ]);
  };

  if (loading && subjects.length === 0) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Input
          placeholder="Search subjects..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={styles.searchInput}
        />
        <Button
          title="Add Subject"
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
        {visibleSubjects.length === 0 ? (
          <Card style={styles.emptyCard}>
            <BookOpen size={48} color={theme.colors.text.muted} />
            <Text style={styles.emptyText}>
              {searchTerm ? 'No subjects found' : 'No subjects yet'}
            </Text>
            {!searchTerm && (
              <Button title="Add First Subject" onPress={openCreate} style={styles.emptyButton} />
            )}
          </Card>
        ) : (
          visibleSubjects.map((subject, index) => {
            const chipColor = getSubjectColor(index);
            return (
              <Pressable key={subject.id} onPress={() => {}}>
                <Card style={styles.subjectCard}>
                  <View style={styles.subjectHeader}>
                    <View style={styles.subjectInfo}>
                      <View style={[styles.subjectChip, { backgroundColor: chipColor + '20' }]}>
                        <Hash size={16} color={chipColor} />
                        <Text style={[styles.subjectCode, { color: chipColor }]}>
                          {subject.code}
                        </Text>
                      </View>
                      <View style={styles.subjectDetails}>
                        <Text style={styles.subjectName}>{subject.name}</Text>
                        <Text style={styles.subjectMeta}>Code: {subject.code}</Text>
                      </View>
                    </View>
                    <View style={styles.subjectActions}>
                      <Pressable
                        style={styles.actionButton}
                        onPress={(e) => openEdit(subject, e)}
                      >
                        <Edit2 size={18} color={theme.colors.primary.base} />
                      </Pressable>
                      <Pressable
                        style={styles.actionButton}
                        onPress={(e) => handleDelete(subject, e)}
                      >
                        <Trash2 size={18} color={theme.colors.error.base} />
                      </Pressable>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })
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
    subjectCard: {
      marginBottom: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: safeTheme.colors.surface.primary,
    },
    subjectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    subjectInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    subjectChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.roundness,
      marginRight: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    subjectCode: {
      fontSize: theme.typography.fontSizes.xs,
      fontWeight: theme.typography.fontWeights.semibold,
    },
    subjectDetails: {
      flex: 1,
    },
    subjectName: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 2,
    },
    subjectMeta: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    subjectActions: {
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
