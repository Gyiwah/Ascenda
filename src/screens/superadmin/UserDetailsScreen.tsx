import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { User, Mail, Building2, Shield, Edit2, Calendar } from 'lucide-react-native';

import { userService } from '@/api/users';
import { schoolService } from '@/api/schools';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { ThemeType } from '@/theme/@themeConfig';

const getRoleBadgeStyle = (role: string, theme: ThemeType) => {
  const roleMap: Record<string, { backgroundColor: string }> = {
    super_admin: { backgroundColor: theme.colors.primary.base + '1A' },
    admin: { backgroundColor: theme.colors.accent.base + '1A' },
    headmaster: { backgroundColor: theme.colors.warn.base + '1A' },
    teacher: { backgroundColor: theme.colors.primary.light + '1A' },
    student: { backgroundColor: theme.colors.text.secondary + '1A' },
  };
  return roleMap[role] || roleMap.student;
};

export default function UserDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const userId = route.params?.userId;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);

  // Auto-refresh on screen focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('[UserDetailsScreen] Screen focused, refreshing data...');
      if (userId) {
        loadData();
      }
    }, [userId])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const userRes = await userService.getById(userId);
      if (userRes.error) throw userRes.error;
      setUser(userRes.data);

      if (userRes.data?.school_id) {
        const schoolRes = await schoolService.getById(userRes.data.school_id);
        if (!schoolRes.error && schoolRes.data) {
          setSchool(schoolRes.data);
        }
      }
    } catch (err: any) {
      console.error('[UserDetailsScreen] Error loading user details', err);
      showToast('Failed to load user details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return <Loader />;
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

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
      <View style={styles.header}>
        <View style={styles.avatar}>
          <User size={32} color={theme.colors.text.inverse} />
        </View>
        <Text style={styles.userName}>{user.full_name || 'No name'}</Text>
        <View style={[styles.roleBadge, getRoleBadgeStyle(user.role, theme)]}>
          <Text style={styles.roleText}>{user.role}</Text>
        </View>
      </View>

      <Card style={styles.card}>
        <View style={styles.infoRow}>
          <Mail size={20} color={theme.colors.text.secondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        </View>

        {school && (
          <View style={[styles.infoRow, styles.infoRowSpacing]}>
            <Building2 size={20} color={theme.colors.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>School</Text>
              <Text style={styles.infoValue}>{school.name}</Text>
              <Text style={styles.infoSubValue}>Code: {school.code}</Text>
            </View>
          </View>
        )}

        <View style={[styles.infoRow, styles.infoRowSpacing]}>
          <Shield size={20} color={theme.colors.text.secondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{user.role}</Text>
          </View>
        </View>

        {user.created_at && (
          <View style={[styles.infoRow, styles.infoRowSpacing]}>
            <Calendar size={20} color={theme.colors.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Joined</Text>
              <Text style={styles.infoValue}>{formatDate(user.created_at)}</Text>
            </View>
          </View>
        )}

        <View style={[styles.infoRow, styles.infoRowSpacing]}>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={[styles.statusBadge, user.is_active ? styles.statusActive : styles.statusInactive]}>
              <Text style={[styles.statusText, user.is_active ? styles.statusTextActive : styles.statusTextInactive]}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <View style={styles.actions}>
        <Button
          title="Edit User"
          onPress={() => navigation.navigate('AddUser', { userId: user.id })}
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
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary.base,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    userName: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    roleBadge: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.roundness / 2,
    },
    roleText: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.colors.text.secondary,
      textTransform: 'capitalize',
    },
    card: {
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.lg,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
    },
    infoRowSpacing: {
      marginTop: theme.spacing.lg,
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
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.colors.text.primary,
    },
    infoSubValue: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs / 2,
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs / 2,
      borderRadius: theme.roundness / 2,
    },
    statusActive: {
      backgroundColor: theme.colors.primary.base + '1A',
    },
    statusInactive: {
      backgroundColor: theme.colors.text.secondary + '1A',
    },
    statusText: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.medium,
    },
    statusTextActive: {
      color: theme.colors.primary.base,
    },
    statusTextInactive: {
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

