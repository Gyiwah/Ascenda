import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  MapPin,
  Hash,
  User,
  Edit2,
  Mail,
  Phone,
  Inbox,
} from 'lucide-react-native';

import { schoolService } from '@/api/schools';
import { userService } from '@/api/users';
import { studentService } from '@/api/students';
import { classService } from '@/api/classes';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { School } from '@/types/database';

export default function SchoolDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const schoolId = route.params?.schoolId;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [school, setSchool] = useState<School | null>(null);
  const [admin, setAdmin] = useState<any>(null);
  const [stats, setStats] = useState<{ teachers: number; students: number; classes: number }>({
    teachers: 0,
    students: 0,
    classes: 0,
  });

  const loadData = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const results = await Promise.allSettled([
        schoolService.getById(schoolId),
        studentService.getAll(schoolId),
        userService.getByRole('teacher', schoolId),
        classService.getAll(schoolId),
        userService.getByRole('admin', schoolId),
      ]);

      // Safely extract results with proper defaults
      const schoolRes = results[0]?.status === 'fulfilled' 
        ? (results[0].value || { data: null, error: null })
        : { data: null, error: results[0]?.reason || new Error('Failed to load school') };
      
      const studentsResult = results[1]?.status === 'fulfilled'
        ? (results[1].value || { data: null, error: null })
        : { data: null, error: results[1]?.reason || null };
      
      const teachersResult = results[2]?.status === 'fulfilled'
        ? (results[2].value || { data: null, error: null })
        : { data: null, error: results[2]?.reason || null };
      
      const classesResult = results[3]?.status === 'fulfilled'
        ? (results[3].value || { data: null, error: null })
        : { data: null, error: results[3]?.reason || null };
      
      const adminRes = results[4]?.status === 'fulfilled'
        ? (results[4].value || { data: null, error: null })
        : { data: null, error: results[4]?.reason || null };

      if (!schoolRes || schoolRes.error) {
        throw schoolRes?.error || new Error('Failed to load school data');
      }

      // Ensure all results have data property (default to null if undefined)
      const safeStudentsResult = studentsResult || { data: null, error: null };
      const safeTeachersResult = teachersResult || { data: null, error: null };
      const safeClassesResult = classesResult || { data: null, error: null };
      const safeAdminRes = adminRes || { data: null, error: null };

      // Log results for debugging
      if (__DEV__) {
        try {
          console.debug('[SchoolDetailsScreen] loadData results:', {
            school: { data: schoolRes?.data?.id, error: schoolRes?.error },
            students: { data: safeStudentsResult?.data?.length, error: safeStudentsResult?.error },
            teachers: { data: safeTeachersResult?.data?.length, error: safeTeachersResult?.error },
            classes: { data: safeClassesResult?.data?.length, error: safeClassesResult?.error },
          });
        } catch (logErr) {
          console.warn('[SchoolDetailsScreen] Error logging results:', logErr);
        }
      }

      setSchool(schoolRes.data);
      setStats({
        teachers: (Array.isArray(safeTeachersResult.data) ? safeTeachersResult.data.length : 0),
        students: (Array.isArray(safeStudentsResult.data) ? safeStudentsResult.data.length : 0),
        classes: (Array.isArray(safeClassesResult.data) ? safeClassesResult.data.length : 0),
      });

      if (Array.isArray(safeAdminRes.data) && safeAdminRes.data.length > 0 && safeAdminRes.data[0]) {
        const adminData = safeAdminRes.data[0];
        if (adminData && typeof adminData === 'object') {
          setAdmin(adminData);
        } else {
          setAdmin(null);
        }
      } else {
        setAdmin(null);
      }

      // Show warnings for individual errors but don't block the UI
      if (safeStudentsResult.error) {
        console.warn('[SchoolDetailsScreen] Failed to load students:', safeStudentsResult.error);
      }
      if (safeTeachersResult.error) {
        console.warn('[SchoolDetailsScreen] Failed to load teachers:', safeTeachersResult.error);
      }
      if (safeClassesResult.error) {
        console.warn('[SchoolDetailsScreen] Failed to load classes:', safeClassesResult.error);
      }
    } catch (err) {
      console.error('[SchoolDetailsScreen]', err);
      showToast('Failed to load school details', 'error');
    } finally {
      setLoading(false);
    }
  }, [schoolId, showToast]);

  useFocusEffect(
    useCallback(() => {
      if (schoolId) loadData();
    }, [schoolId, loadData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) return <Loader />;

  if (!school || typeof school !== 'object') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>School not found</Text>
      </View>
    );
  }

  // Ensure stats is always an object with required properties
  const safeStats = (stats && typeof stats === 'object') ? stats : { teachers: 0, students: 0, classes: 0 };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary.base}
        />
      }
    >
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        {school?.logo_url ? (
          <Image source={{ uri: school.logo_url }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Building2 size={32} color={theme.colors.text.inverse} />
          </View>
        )}

        <Text style={styles.schoolName}>{school?.name || 'School'}</Text>

        {school?.code && (
          <View style={styles.codeRow}>
            <Hash size={16} color={theme.colors.text.secondary} />
            <Text style={styles.schoolCode}>{school.code}</Text>
          </View>
        )}

        {school?.address && (
          <View style={styles.addressRow}>
            <MapPin size={16} color={theme.colors.text.secondary} />
            <Text style={styles.address}>{school.address}</Text>
          </View>
        )}

        {(school?.contact_email || school?.contact_phone || (school as any)?.postal_address) && (
          <View style={styles.contactBlock}>
            {school?.contact_email && (
              <View style={styles.contactRow}>
                <Mail size={16} color={theme.colors.text.secondary} />
                <Text style={styles.contactText}>{school.contact_email}</Text>
              </View>
            )}
            {school?.contact_phone && (
              <View style={styles.contactRow}>
                <Phone size={16} color={theme.colors.text.secondary} />
                <Text style={styles.contactText}>{school.contact_phone}</Text>
              </View>
            )}
            {(school as any)?.postal_address && (
              <View style={styles.contactRow}>
                <Inbox size={16} color={theme.colors.text.secondary} />
                <Text style={styles.contactText}>
                  {(school as any).postal_address}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ================= STATS ================= */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Users size={24} color={theme.colors.primary.base} />
          <Text style={styles.statValue}>{safeStats.teachers ?? 0}</Text>
          <Text style={styles.statLabel}>Teachers</Text>
        </Card>

        <Card style={styles.statCard}>
          <GraduationCap size={24} color={theme.colors.accent.base} />
          <Text style={styles.statValue}>{safeStats.students ?? 0}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </Card>

        <Card style={styles.statCard}>
          <BookOpen size={24} color={theme.colors.warn.base} />
          <Text style={styles.statValue}>{safeStats.classes ?? 0}</Text>
          <Text style={styles.statLabel}>Classes</Text>
        </Card>
      </View>

      {/* ================= ADMIN ================= */}
      {admin && typeof admin === 'object' && (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <User size={20} color={theme.colors.primary.base} />
            <Text style={styles.cardTitle}>School Admin</Text>
          </View>
          <Text style={styles.adminName}>{admin?.full_name || admin?.email || 'Admin'}</Text>
          {admin?.email && (
            <Text style={styles.adminEmail}>{admin.email}</Text>
          )}
        </Card>
      )}

      {/* ================= ACTIONS ================= */}
      <View style={styles.actions}>
        <Button
          title="Edit School"
          onPress={() => navigation.navigate('AddSchool', { schoolId })}
          icon={<Edit2 size={18} color={theme.colors.text.inverse} />}
        />
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
    scrollContent: {
      padding: theme.spacing.lg,
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    logo: {
      width: 100,
      height: 100,
      borderRadius: theme.roundness,
      marginBottom: theme.spacing.md,
    },
    logoPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.primary.base,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    schoolName: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    codeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs / 2,
      marginBottom: theme.spacing.xs,
    },
    schoolCode: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.secondary,
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs / 2,
    },
    address: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      maxWidth: 280,
    },
    contactBlock: {
      marginTop: theme.spacing.sm,
      gap: theme.spacing.xs,
      alignItems: 'center',
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs / 2,
    },
    contactText: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    statCard: {
      flex: 1,
      alignItems: 'center',
      padding: theme.spacing.md,
    },
    statValue: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      marginTop: theme.spacing.sm,
    },
    statLabel: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs,
    },
    card: {
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.lg,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    cardTitle: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.semibold,
    },
    adminName: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.medium,
      marginBottom: theme.spacing.xs,
    },
    adminEmail: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    actions: {
      marginTop: theme.spacing.md,
    },
    errorText: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.error.base,
      textAlign: 'center',
      marginTop: theme.spacing.xl,
    },
  });
