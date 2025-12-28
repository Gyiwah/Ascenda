import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/utils/useAuth';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { GraduationCap, BookOpen, Award } from 'lucide-react-native';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { StudentUser } from '@/types/database';

/**
 * StudentDashboardScreen - Main dashboard for students
 * Displays student information, class details, and academic progress
 */
export default function StudentDashboardScreen() {
  const { user } = useAuth();
  const theme = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Type guard to ensure user is a StudentUser
  const student = user as StudentUser | null;

  useFocusEffect(
    React.useCallback(() => {
      // Refresh data when screen is focused
      // TODO: Load student assessments, class info, etc.
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    // TODO: Refresh student data
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  if (!student) {
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
        <Text style={styles.title}>Welcome, {student.full_name}</Text>
        <Text style={styles.subtitle}>Student Dashboard</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <GraduationCap size={24} color={theme.colors.primary.base} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Admission Number</Text>
              <Text style={styles.infoValue}>{student.admission_number}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <BookOpen size={24} color={theme.colors.accent.base} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Class</Text>
              <Text style={styles.infoValue}>Loading...</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Award size={24} color={theme.colors.warn.base} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Academic Progress</Text>
              <Text style={styles.infoValue}>Coming soon...</Text>
            </View>
          </View>
        </Card>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Student dashboard features coming soon...
          </Text>
          <Text style={styles.placeholderSubtext}>
            View assessments, grades, and academic progress
          </Text>
        </View>
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
    },
    title: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.secondary,
    },
    content: {
      padding: theme.spacing.lg,
    },
    infoCard: {
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs / 2,
    },
    infoValue: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    placeholder: {
      padding: theme.spacing.xl,
      alignItems: 'center',
      marginTop: theme.spacing.lg,
    },
    placeholderText: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    placeholderSubtext: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
  });

