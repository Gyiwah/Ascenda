import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, Pressable } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Building2, Edit2, Trash2, Hash } from 'lucide-react-native';

import { schoolService } from '@/api/schools';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { School } from '@/types/database';
const PAGE_SIZE = 8;

export default function SchoolsScreen() {
  const navigation = useNavigation<any>();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  useFocusEffect(
    React.useCallback(() => {
      loadSchools();
    }, [])
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, schools.length]);

  const filteredSchools = useMemo(() => {
    if (!searchTerm.trim()) return schools;
    const query = searchTerm.trim().toLowerCase();
    return schools.filter((school) =>
      [school.name, school.code].some((value) => value?.toLowerCase().includes(query))
    );
  }, [schools, searchTerm]);

  const visibleSchools = useMemo(
    () => filteredSchools.slice(0, page * PAGE_SIZE),
    [filteredSchools, page]
  );

  const hasMore = visibleSchools.length < filteredSchools.length;

  const openCreate = () => {
    navigation.navigate('AddSchool');
  };

  const openEdit = (school: School, e: any) => {
    e.stopPropagation();
    navigation.navigate('AddSchool', { schoolId: school.id });
  };

  const loadSchools = async () => {
    setLoading(true);
    try {
      const { data, error } = await schoolService.getAll();
      if (error) throw error;
      setSchools(data || []);
    } catch (err: any) {
      console.error('Error loading schools', err);
      showToast('Failed to load schools', 'error');
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = (school: School) => {
    Alert.alert('Delete school', `Delete "${school.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await schoolService.remove(school.id);
            if (error) throw error;
            showToast('School deleted', 'success');
            await loadSchools();
          } catch (err: any) {
            console.error('Delete school error', err);
            showToast(err?.message || 'Delete failed', 'error');
          }
        },
      },
    ]);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Schools</Text>
          <Text style={styles.subtitle}>{`${filteredSchools.length} results`}</Text>
        </View>
        <Button title="New School" onPress={openCreate} />
      </View>

      <Input
        label="Search"
        placeholder="Search by name or code"
        value={searchTerm}
        onChangeText={setSearchTerm}
        style={styles.searchInput}
      />

      {visibleSchools.length === 0 ? (
        <View style={styles.emptyState}>
          <Building2 size={48} color={theme.colors.text.secondary} />
          <Text style={styles.emptyStateTitle}>No schools yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            Create a school to get started or adjust your filters.
          </Text>
        </View>
      ) : (
        visibleSchools.map((school) => (
          <Pressable
            key={school.id}
            onPress={() => navigation.navigate('SchoolDetails', { schoolId: school.id })}
          >
            <Card style={styles.card}>
              <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                {school.logo_url ? (
                  <Image source={{ uri: school.logo_url }} style={styles.cardLogo} />
                ) : (
                  <View style={styles.cardLogoPlaceholder}>
                    <Building2 size={24} color={theme.colors.text.inverse} />
                  </View>
                )}
                <View style={styles.cardInfo}>
                  <Text style={styles.schoolName}>{school.name}</Text>
                  <View style={styles.codeRow}>
                    <Hash size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.schoolCode}>{school.code}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  style={styles.actionButton}
                  onPress={(e) => openEdit(school, e)}
                >
                  <Edit2 size={18} color={theme.colors.primary.base} />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </Pressable>
                <View style={styles.actionDivider} />
                <Pressable
                  style={[styles.actionButton, styles.actionButtonDanger]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(school);
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

      {hasMore ? (
        <Button
          title="Load more"
          onPress={() => setPage((prev) => prev + 1)}
          variant="outline"
          style={styles.loadMore}
        />
      ) : null}
    </ScrollView>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    scrollContent: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing['2xl'],
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
    },
    subtitle: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs,
    },
    searchInput: {
      marginBottom: theme.spacing.lg,
    },
    animatedWrapper: {
      marginBottom: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.roundness,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
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
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    cardLogo: {
      width: 64,
      height: 64,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.background.secondary,
    },
    cardLogoPlaceholder: {
      width: 64,
      height: 64,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.primary.base,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardInfo: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    schoolName: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    codeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs / 2,
    },
    schoolCode: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeights.medium,
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
    actionDivider: {
      width: 1,
      height: 20,
      backgroundColor: theme.colors.divider,
    },
    loadMore: {
      marginTop: theme.spacing.lg,
    },
    emptyState: {
      paddingVertical: theme.spacing['2xl'],
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    emptyStateTitle: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    emptyStateSubtitle: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      maxWidth: 280,
    },
  });
