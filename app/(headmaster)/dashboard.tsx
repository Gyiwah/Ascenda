import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing, typography } from '@/theme';
import { CheckCircle, FileText, TrendingUp, BookOpen } from 'lucide-react-native';

export default function HeadmasterDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Headmaster Dashboard</Text>
        <Text style={styles.subtitle}>Welcome, {user?.full_name}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(headmaster)/approvals')}
        >
          <CheckCircle size={24} color={colors.primary[600]} />
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Approve Assessments</Text>
            <Text style={styles.actionSubtitle}>Review and approve scores</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(headmaster)/promotions')}
        >
          <TrendingUp size={24} color={colors.primary[600]} />
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Promote Students</Text>
            <Text style={styles.actionSubtitle}>Manage class promotions</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(headmaster)/reports')}
        >
          <FileText size={24} color={colors.primary[600]} />
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Generate Reports</Text>
            <Text style={styles.actionSubtitle}>Create PDF reports</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(headmaster)/overview')}
        >
          <BookOpen size={24} color={colors.primary[600]} />
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Class Overview</Text>
            <Text style={styles.actionSubtitle}>View all class performance</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    padding: spacing.xl,
    backgroundColor: colors.primary[600],
  },
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSizes.base,
    color: colors.text.inverse,
  },
  content: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  actionCard: {
    backgroundColor: colors.background.light,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  actionSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
  },
});
