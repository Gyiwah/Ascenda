import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/utils/useAuth';
import { studentService } from '@/api/students';
import { userService } from '@/api/users';
import { classService } from '@/api/classes';
import { schoolService } from '@/api/schools';
import { subjectService } from '@/api/subjects';
import { teacherAssignmentService } from '@/api/teacherAssignments';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Users, GraduationCap, BookOpen, Hash, Calendar, TrendingUp } from 'lucide-react-native';
import { useAppTheme } from '@/theme/@ThemeProvider';

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const theme = useAppTheme();
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    subjects: 0,
    assignments: 0,
  });
  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const styles = useMemo(() => makeStyles(theme || {}), [theme]);

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [user?.school_id])
  );

  const loadStats = async () => {
    if (!user?.school_id) return;

    try {
      const [studentsResult, teachersResult, classesResult, subjectsResult, assignmentsResult, schoolResult] = await Promise.all([
        studentService.getAll(user.school_id),
        userService.getByRole('teacher', user.school_id),
        classService.getAll(user.school_id),
        subjectService.getAll(user.school_id),
        teacherAssignmentService.getAll(user.school_id),
        schoolService.getById(user.school_id),
      ]);

      setStats({
        students: studentsResult.data?.length || 0,
        teachers: teachersResult.data?.length || 0,
        classes: classesResult.data?.length || 0,
        subjects: subjectsResult.data?.length || 0,
        assignments: assignmentsResult.data?.length || 0,
      });

      if (schoolResult.data) {
        setSchoolName(schoolResult.data.name);
        setSchoolCode(schoolResult.data.code || '');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }; 

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (loading) return <Loader />;

  // Ensure theme is defined for inline styles
  const safeTheme = theme || {
    colors: {
      primary: { base: '#007AFF', light: '#4DA6FF' },
      accent: { base: '#5856D6' },
      warn: { base: '#FF9500' },
      text: { secondary: '#999999' },
      background: { primary: '#ffffff' },
    },
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={handleRefresh}
          tintColor={safeTheme.colors.primary.base}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>{schoolName || 'Admin Dashboard'}</Text>
        {schoolCode && (
          <View style={styles.codeRow}>
            <Hash size={14} color={safeTheme.colors.text.secondary} />
            <Text style={styles.codeText}>{schoolCode}</Text>
          </View>
        )}
        <Text style={styles.subtitle}>Welcome, {user?.full_name}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsRow}>
          <Pressable 
            style={styles.statCardWrapper}
            onPress={() => navigation.navigate('Students')}
          >
            <Card style={styles.statCard}>
              <GraduationCap size={28} color={safeTheme.colors.primary.base} />
              <Text style={styles.statValue}>{stats.students}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </Card>
          </Pressable>

          <Pressable 
            style={styles.statCardWrapper}
            onPress={() => navigation.navigate('Teachers')}
          >
            <Card style={styles.statCard}>
              <Users size={28} color={safeTheme.colors.accent.base} />
              <Text style={styles.statValue}>{stats.teachers}</Text>
              <Text style={styles.statLabel}>Teachers</Text>
            </Card>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <Pressable 
            style={styles.statCardWrapper}
            onPress={() => navigation.navigate('AcademicSetup')}
          >
            <Card style={styles.statCard}>
              <BookOpen size={28} color={safeTheme.colors.warn.base} />
              <Text style={styles.statValue}>{stats.classes}</Text>
              <Text style={styles.statLabel}>Classrooms</Text>
            </Card>
          </Pressable>

          <Pressable 
            style={styles.statCardWrapper}
            onPress={() => navigation.navigate('AcademicSetup')}
          >
            <Card style={styles.statCard}>
              <Hash size={28} color={safeTheme.colors.primary.light} />
              <Text style={styles.statValue}>{stats.subjects}</Text>
              <Text style={styles.statLabel}>Subjects</Text>
            </Card>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Academic Setup</Text>
        <Pressable onPress={() => navigation.navigate('AcademicSetup')}>
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Calendar size={20} color={safeTheme.colors.primary.base} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Teacher Assignments</Text>
                <Text style={styles.infoValue}>{stats.assignments} active assignments</Text>
              </View>
              <TrendingUp size={20} color={safeTheme.colors.text.secondary} />
            </View>
          </Card>
        </Pressable>
      </View>
    </ScrollView>
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
      backgroundColor: safeTheme.colors.surface.primary,
    },
    title: {
      fontSize: safeTheme.typography.fontSizes['2xl'],
      fontWeight: safeTheme.typography.fontWeights.bold,
      color: safeTheme.colors.text.primary,
      marginBottom: safeTheme.spacing.xs,
    },
    codeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: safeTheme.spacing.xs / 2,
      marginTop: safeTheme.spacing.xs,
      marginBottom: safeTheme.spacing.xs,
    },
    codeText: {
      fontSize: safeTheme.typography.fontSizes.sm,
      color: safeTheme.colors.text.secondary,
      fontWeight: safeTheme.typography.fontWeights.medium,
    },
    subtitle: {
      fontSize: safeTheme.typography.fontSizes.base,
      color: safeTheme.colors.text.secondary,
    },
    content: {
      padding: safeTheme.spacing.lg,
    },
    sectionTitle: {
      fontSize: safeTheme.typography.fontSizes.lg,
      fontWeight: safeTheme.typography.fontWeights.semibold,
      color: safeTheme.colors.text.primary,
      marginTop: safeTheme.spacing.lg,
      marginBottom: safeTheme.spacing.md,
    },
    infoCard: {
      padding: safeTheme.spacing.md,
      marginTop: safeTheme.spacing.sm,
      backgroundColor: safeTheme.colors.surface.primary,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: safeTheme.spacing.md,
    },
    infoContent: {
      flex: 1,
    },
    infoTitle: {
      fontSize: safeTheme.typography.fontSizes.base,
      fontWeight: safeTheme.typography.fontWeights.semibold,
      color: safeTheme.colors.text.primary,
      marginBottom: safeTheme.spacing.xs / 2,
    },
    infoValue: {
      fontSize: safeTheme.typography.fontSizes.sm,
      color: safeTheme.colors.text.secondary,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: safeTheme.spacing.md,
      gap: safeTheme.spacing.md,
    },
    statCardWrapper: {
      flex: 1,
    },
    statCard: {
      alignItems: 'center',
      padding: safeTheme.spacing.lg,
      backgroundColor: safeTheme.colors.surface.primary,
    },
    statValue: {
      fontSize: safeTheme.typography.fontSizes['3xl'],
      fontWeight: safeTheme.typography.fontWeights.bold,
      color: safeTheme.colors.text.primary,
      marginTop: safeTheme.spacing.sm,
    },
    statLabel: {
      fontSize: safeTheme.typography.fontSizes.sm,
      color: safeTheme.colors.text.secondary,
      marginTop: safeTheme.spacing.xs,
    },
  });
}

