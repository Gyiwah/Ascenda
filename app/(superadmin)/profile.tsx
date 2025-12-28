import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, Mail, Shield, Building2, LogOut } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <Card style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <User size={40} color={colors.primary[600]} />
          </View>
          <Text style={styles.userName}>{user.full_name}</Text>
          <View style={styles.roleBadge}>
            <Shield size={16} color={colors.primary[600]} />
            <Text style={styles.roleText}>
              {user.role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Mail size={20} color={colors.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Shield size={20} color={colors.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>
                {user.role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </Text>
            </View>
          </View>

          {user.school_id && (
            <View style={styles.infoRow}>
              <Building2 size={20} color={colors.text.secondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>School ID</Text>
                <Text style={styles.infoValue}>{user.school_id.substring(0, 8)}...</Text>
              </View>
            </View>
          )}
        </View>
      </Card>

      <Button
        title="Logout"
        onPress={handleLogout}
        variant="outline"
        style={[styles.logoutButton, { borderColor: colors.error[600] }]}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.primary[600],
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.inverse,
  },
  profileCard: {
    padding: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userName: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary[50],
    borderRadius: 16,
  },
  roleText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary[600],
  },
  infoSection: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
  },
  infoValue: {
    fontSize: typography.fontSizes.base,
    color: colors.text.primary,
  },
  logoutButton: {
    marginTop: spacing.md,
    borderColor: colors.error[600],
  },
  errorText: {
    fontSize: typography.fontSizes.base,
    color: colors.error[600],
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

