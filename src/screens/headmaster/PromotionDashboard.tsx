import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/utils/useAuth';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { classService } from '@/api/classes';
import { GraduationCap, Users, ArrowRight, AlertCircle, Filter } from 'lucide-react-native';
import { Class } from '@/types/database';
import { isTerm3Locked } from '@/api/headmaster/promotions';

export default function PromotionDashboard() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [term3LockedStatus, setTerm3LockedStatus] = useState<Record<string, boolean>>({});
  const currentYear = new Date().getFullYear();
  const defaultAcademicYear = `${currentYear}/${currentYear + 1}`;
  const [academicYear, setAcademicYear] = useState<string>(defaultAcademicYear);

  useFocusEffect(
    useCallback(() => {
      if (user?.school_id) {
        loadClasses();
      }
    }, [user?.school_id, academicYear])
  );

  const loadClasses = async () => {
    if (!user?.school_id) return;

    setLoading(true);
    try {
      const { data, error } = await classService.getAll(user.school_id);
      if (error) throw error;

      setClasses(data || []);

      // Check Term 3 lock status for each class
      const lockStatus: Record<string, boolean> = {};
      for (const classItem of data || []) {
        const { data: isLocked } = await isTerm3Locked(classItem.id, academicYear);
        lockStatus[classItem.id] = isLocked || false;
      }
      setTerm3LockedStatus(lockStatus);
    } catch (err: any) {
      console.error('[PromotionDashboard] Error loading classes:', err);
      showToast('Failed to load classes', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClasses();
  };

  const handleBulkPromotion = (classItem: Class) => {
    if (!term3LockedStatus[classItem.id]) {
      showToast('Term 3 results must be locked before promotion', 'warning');
      return;
    }
    navigation.navigate('BulkPromotionWizard', {
      classId: classItem.id,
      className: classItem.name,
      academicYear,
    });
  };

  const handleIndividualPromotion = (classItem: Class) => {
    if (!term3LockedStatus[classItem.id]) {
      showToast('Term 3 results must be locked before promotion', 'warning');
      return;
    }
    navigation.navigate('IndividualPromotion', {
      classId: classItem.id,
      className: classItem.name,
      academicYear,
    });
  };

  if (loading && classes.length === 0) {
    return <Loader />;
  }

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
        <Text style={styles.title}>Student Promotions</Text>
        <Text style={styles.subtitle}>
          Manage student promotions after Term 3 results are locked
        </Text>
      </View>

      {/* Academic Year Filter */}
      <Card style={styles.filterCard}>
        <View style={styles.filterHeader}>
          <Filter size={18} color={theme.colors.text.secondary} />
          <Text style={styles.filterTitle}>Academic Year</Text>
        </View>
        <Input
          value={academicYear}
          onChangeText={setAcademicYear}
          keyboardType="numeric"
          style={styles.yearInput}
          placeholder="Enter academic year"
        />
      </Card>

      <View style={styles.content}>
        {classes.length === 0 ? (
          <Card style={styles.emptyCard}>
            <GraduationCap size={48} color={theme.colors.text.muted} />
            <Text style={styles.emptyText}>No classes found</Text>
            <Text style={styles.emptySubtext}>
              Classes will appear here once they are created
            </Text>
          </Card>
        ) : (
          classes.map((classItem) => {
            const isLocked = term3LockedStatus[classItem.id] || false;
            return (
              <Card key={classItem.id} style={styles.classCard}>
                <View style={styles.classHeader}>
                  <View style={styles.classIcon}>
                    <GraduationCap size={20} color={theme.colors.text.inverse} />
                  </View>
                  <View style={styles.classInfo}>
                    <Text style={styles.className}>{classItem.name}</Text>
                    <Text style={styles.classMeta}>
                      Level {classItem.level} • {academicYear}
                    </Text>
                  </View>
                  {isLocked ? (
                    <View style={styles.lockedBadge}>
                      <Text style={styles.lockedText}>Term 3 Locked</Text>
                    </View>
                  ) : (
                    <View style={styles.unlockedBadge}>
                      <AlertCircle size={16} color={theme.colors.warn.base} />
                      <Text style={styles.unlockedText}>Term 3 Not Locked</Text>
                    </View>
                  )}
                </View>

                <View style={styles.actions}>
                  <Pressable
                    onPress={() => handleBulkPromotion(classItem)}
                    disabled={!isLocked}
                    style={[
                      styles.actionButton,
                      !isLocked && styles.actionButtonDisabled,
                    ]}
                  >
                    <Users size={18} color={isLocked ? theme.colors.primary.base : theme.colors.text.muted} />
                    <Text
                      style={[
                        styles.actionButtonText,
                        !isLocked && styles.actionButtonTextDisabled,
                      ]}
                    >
                      Bulk Promotion
                    </Text>
                    <ArrowRight
                      size={18}
                      color={isLocked ? theme.colors.primary.base : theme.colors.text.muted}
                    />
                  </Pressable>

                  <Pressable
                    onPress={() => handleIndividualPromotion(classItem)}
                    disabled={!isLocked}
                    style={[
                      styles.actionButton,
                      !isLocked && styles.actionButtonDisabled,
                    ]}
                  >
                    <GraduationCap size={18} color={isLocked ? theme.colors.accent.base : theme.colors.text.muted} />
                    <Text
                      style={[
                        styles.actionButtonText,
                        !isLocked && styles.actionButtonTextDisabled,
                      ]}
                    >
                      Individual Promotion
                    </Text>
                    <ArrowRight
                      size={18}
                      color={isLocked ? theme.colors.accent.base : theme.colors.text.muted}
                    />
                  </Pressable>
                </View>
              </Card>
            );
          })
        )}
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
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    title: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    content: {
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
    classCard: {
      marginBottom: theme.spacing.md,
      padding: theme.spacing.lg,
    },
    classHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.md,
    },
    classIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary.base,
      justifyContent: 'center',
      alignItems: 'center',
    },
    classInfo: {
      flex: 1,
    },
    className: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 2,
    },
    classMeta: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    lockedBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      backgroundColor: theme.colors.success[500] + '1A',
      borderRadius: theme.roundness,
    },
    lockedText: {
      fontSize: theme.typography.fontSizes.xs,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.success[500],
    },
    unlockedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs / 2,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      backgroundColor: theme.colors.warn.base + '1A',
      borderRadius: theme.roundness,
    },
    unlockedText: {
      fontSize: theme.typography.fontSizes.xs,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.warn.base,
    },
    actions: {
      gap: theme.spacing.sm,
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
      gap: theme.spacing.sm,
    },
    actionButtonDisabled: {
      opacity: 0.5,
    },
    actionButtonText: {
      flex: 1,
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    actionButtonTextDisabled: {
      color: theme.colors.text.muted,
    },
    filterCard: {
      margin: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      padding: theme.spacing.md,
    },
    filterHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.md,
    },
    filterTitle: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    yearInput: {
      marginBottom: 0,
    },
  });

