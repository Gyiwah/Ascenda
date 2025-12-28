import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BookOpen, Edit2, Trash2, Plus, GraduationCap } from 'lucide-react-native';

import { useAuth } from '@/utils/useAuth';
import { classService } from '@/api/classes';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { Class } from '@/types/database';

const PAGE_SIZE = 10;

/**
 * ClassesScreen - Manage classes for the school
 * Displays list of classes with CRUD operations
 */
export default function ClassesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [classes, setClasses] = useState<Class[]>([]);
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
    setPage(1);
  }, [searchTerm]);

  const filteredClasses = useMemo(() => {
    if (!searchTerm.trim()) return classes;
    const query = searchTerm.trim().toLowerCase();
    return classes.filter((cls) =>
      [cls.name, cls.academic_year].some((value) => value?.toLowerCase().includes(query))
    );
  }, [classes, searchTerm]);

  const visibleClasses = useMemo(
    () => filteredClasses.slice(0, page * PAGE_SIZE),
    [filteredClasses, page]
  );

  const hasMore = visibleClasses.length < filteredClasses.length;

  const loadClasses = async () => {
    if (!user?.school_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await classService.getAll(user.school_id);
      if (error) throw error;
      setClasses(data || []);
    } catch (err: any) {
      console.error('[ClassesScreen] Error loading classes:', err);
      showToast('Failed to load classes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClasses();
    setRefreshing(false);
  };

  const openCreate = () => {
    navigation.navigate('AddClass');
  };

  const openEdit = (cls: Class, e: any) => {
    e.stopPropagation();
    navigation.navigate('AddClass', { classId: cls.id });
  };

  const handleDelete = (cls: Class, e: any) => {
    e.stopPropagation();
    Alert.alert('Delete Class', `Delete "${cls.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await classService.delete(cls.id);
            if (error) throw error;
            showToast('Class deleted', 'success');
            await loadClasses();
          } catch (err: any) {
            console.error('[ClassesScreen] Delete error:', err);
            showToast(err?.message || 'Delete failed', 'error');
          }
        },
      },
    ]);
  };

  if (loading && classes.length === 0) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Input
          placeholder="Search classes..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={styles.searchInput}
        />
        <Button
          title="Add Class"
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
        {visibleClasses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <GraduationCap size={48} color={theme.colors.text.muted} />
            <Text style={styles.emptyText}>
              {searchTerm ? 'No classes found' : 'No classes yet'}
            </Text>
            {!searchTerm && (
              <Button title="Add First Class" onPress={openCreate} style={styles.emptyButton} />
            )}
          </Card>
        ) : (
          visibleClasses.map((cls) => (
            <Pressable key={cls.id} onPress={() => {}}>
              <Card style={styles.classCard}>
                <View style={styles.classHeader}>
                  <View style={styles.classInfo}>
                    <View style={styles.classIcon}>
                      <BookOpen size={20} color={theme.colors.primary.base} />
                    </View>
                    <View style={styles.classDetails}>
                      <Text style={styles.className}>{cls.name}</Text>
                      <Text style={styles.classMeta}>
                        Level: {cls.level} • {cls.academic_year}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.classActions}>
                    <Pressable
                      style={styles.actionButton}
                      onPress={(e) => openEdit(cls, e)}
                    >
                      <Edit2 size={18} color={theme.colors.primary.base} />
                    </Pressable>
                    <Pressable
                      style={styles.actionButton}
                      onPress={(e) => handleDelete(cls, e)}
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
      padding: safeTheme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: safeTheme.colors.border,
      gap: safeTheme.spacing.md,
      backgroundColor: safeTheme.colors.surface.primary,
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
      padding: safeTheme.spacing.lg,
    },
    emptyCard: {
      alignItems: 'center',
      padding: safeTheme.spacing['2xl'],
    },
    emptyText: {
      fontSize: safeTheme.typography.fontSizes.base,
      color: safeTheme.colors.text.secondary,
      marginTop: safeTheme.spacing.md,
      marginBottom: safeTheme.spacing.lg,
    },
    emptyButton: {
      marginTop: safeTheme.spacing.md,
    },
    classCard: {
      marginBottom: safeTheme.spacing.md,
      padding: safeTheme.spacing.md,
      backgroundColor: safeTheme.colors.surface.primary,
    },
    classHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    classInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    classIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: safeTheme.colors.primary.base + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: safeTheme.spacing.md,
    },
    classDetails: {
      flex: 1,
    },
    className: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 2,
    },
    classMeta: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    classActions: {
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

};