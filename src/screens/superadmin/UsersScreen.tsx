import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { CheckSquare, Square, User, Mail, Edit2, Trash2, Building2 } from 'lucide-react-native';

import { userService } from '@/api/users';
import { schoolService } from '@/api/schools';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { ThemeType } from '@/theme/@themeConfig';
import { School, UserRole } from '@/types/database';

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

export default function UsersScreen() {
  const navigation = useNavigation<any>();
  const [users, setUsers] = useState<any[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { showToast } = useToast();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [])
  );

  const load = async () => {
    setLoading(true);
    try {
      const [usersRes, schoolsRes] = await Promise.all([userService.getAll(), schoolService.getAll()]);
      setUsers(usersRes.data || []);
      setSchools(schoolsRes.data || []);
    } catch (err) {
      console.error('Error loading users', err);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    navigation.navigate('AddUser');
  };

  const openEdit = (u: any, e?: any) => {
    if (e) e.stopPropagation();
    navigation.navigate('AddUser', { userId: u.id });
  };


  const handleDelete = (u: any) => {
    Alert.alert('Delete user', `Are you sure you want to delete "${u.email}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const res = await userService.remove(u.id);
          if (res.error) throw res.error;
          showToast('User deleted', 'success');
          setSelectedIds((prev) => prev.filter((id) => id !== u.id));
          load();
        } catch (err: any) {
          console.error('Delete user error', err);
          showToast(err?.message || 'Delete failed', 'error');
        }
      }}
    ]);
  };

  const handleBulkDelete = () => {
    if (!selectedIds.length) return;
    Alert.alert(
      'Delete users',
      `Delete ${selectedIds.length} selected ${selectedIds.length === 1 ? 'user' : 'users'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await userService.removeMany(selectedIds);
              if (error) throw error;
              showToast('Users deleted', 'success');
              setSelectedIds([]);
              load();
            } catch (err: any) {
              console.error('Bulk delete error', err);
              showToast(err?.message || 'Bulk delete failed', 'error');
            }
          },
        },
      ]
    );
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]
    );
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const query = searchTerm.toLowerCase();
    return users.filter((user) => {
      const values = [user.email, user.full_name, user.role, user.school_id];
      return values.some((value: string) => value?.toLowerCase().includes(query));
    });
  }, [users, searchTerm]);


  if (loading) return <Loader />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: theme.spacing.lg }}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Users</Text>
          <Text style={styles.subtitle}>{filteredUsers.length} results</Text>
        </View>
        <View style={styles.headerActions}>
          {selectedIds.length > 0 ? (
            <Button
              title={`Delete (${selectedIds.length})`}
              variant="ghost"
              onPress={handleBulkDelete}
            />
          ) : null}
          <Button title="New User" onPress={openCreate} />
        </View>
      </View>

      <Input
        label="Search"
        placeholder="Search by name, email, or role"
        value={searchTerm}
        onChangeText={setSearchTerm}
        style={styles.searchInput}
      />

      {filteredUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <User size={48} color={theme.colors.text.secondary} />
          <Text style={styles.emptyStateTitle}>No users found</Text>
          <Text style={styles.emptyStateSubtitle}>
            Create a user to get started or adjust your search filters.
          </Text>
        </View>
      ) : (
        filteredUsers.map((user) => {
          const isSelected = selectedIds.includes(user.id);
          const userSchool = schools.find((s) => s.id === user.school_id);
          return (
            <Pressable
              key={user.id}
              onPress={() => navigation.navigate('UserDetails', { userId: user.id })}
            >
              <Card style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Pressable onPress={() => toggleSelection(user.id)} style={styles.checkbox}>
                    {isSelected ? (
                      <CheckSquare color={theme.colors.primary.base} size={24} />
                    ) : (
                      <Square color={theme.colors.text.secondary} size={24} />
                    )}
                  </Pressable>
                  <View style={styles.userAvatar}>
                    <User size={20} color={theme.colors.text.inverse} />
                  </View>
                  <View style={styles.cardInfo}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName}>{user.full_name || 'No name'}</Text>
                      <View style={[styles.roleBadge, getRoleBadgeStyle(user.role, theme)]}>
                        <Text style={styles.roleText}>{user.role}</Text>
                      </View>
                    </View>
                    <View style={styles.userMetaRow}>
                      <Mail size={14} color={theme.colors.text.secondary} />
                      <Text style={styles.userEmail}>{user.email}</Text>
                    </View>
                    {userSchool && (
                      <View style={styles.userMetaRow}>
                        <Building2 size={14} color={theme.colors.text.secondary} />
                        <Text style={styles.userSchool}>{userSchool.name}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={(e) => openEdit(user, e)}
                  >
                    <Edit2 size={18} color={theme.colors.primary.base} />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </Pressable>
                  <View style={styles.actionDivider} />
                  <Pressable
                    style={[styles.actionButton, styles.actionButtonDanger]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(user);
                    }}
                  >
                    <Trash2 size={18} color={theme.colors.error.base} />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </Card>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.primary },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    title: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
    },
    subtitle: {
      marginTop: theme.spacing.xs,
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    searchInput: {
      marginBottom: theme.spacing.lg,
    },
    card: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.roundness,
      padding: theme.spacing.lg,
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
      alignItems: 'flex-start',
      gap: theme.spacing.md,
    },
    checkbox: {
      marginTop: 2,
    },
    userAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary.base,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardInfo: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    userNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
    },
    userName: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    roleBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs / 2,
      borderRadius: theme.roundness / 2,
    },
    roleText: {
      fontSize: theme.typography.fontSizes.xs,
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.colors.text.secondary,
      textTransform: 'capitalize',
    },
    userMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs / 2,
    },
    userEmail: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    userSchool: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
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
