import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, ScrollView } from 'react-native';
import { colors, spacing, typography, hexToRgba } from '@/theme';
import { userService } from '@/services/supabase/users';
import { schoolService } from '@/services/supabase/schools';
import { User, School } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserForm } from '@/components/forms/UserForm';
import { functionsService } from '@/services/supabase/functions';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Users as UsersIcon, Mail, Shield, Building2, ChevronDown } from 'lucide-react-native';
import { Modal as RNModal } from 'react-native';
import { useToast } from '@/contexts/ToastContext';

export default function SuperAdminUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState({ name: '', email: '', password: '', school_id: '' as string });
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const { showToast } = useToast();

  const loadUsers = async () => {
    const { data } = await userService.getAll();
    setUsers(data || []);
  };

  const loadSchools = async () => {
    const { data } = await schoolService.getAll();
    setSchools(data || []);
  };

  const load = async () => {
    setLoading(true);
    await Promise.all([loadUsers(), loadSchools()]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async (values: any) => {
    if (!editing) {
      if (!creating.name || !creating.email || !creating.password || !creating.school_id) {
        Alert.alert('Missing Fields', 'Please provide name, email, password and school.');
        return;
      }
      try {
        const result = await functionsService.createSchoolAdmin({
          name: creating.name,
          email: creating.email,
          password: creating.password,
          school_id: creating.school_id,
        });
        if (result.error) {
          showToast(result.error.message || 'Failed to create school admin', 'error');
          return;
        }
         showToast('School admin created successfully.', 'success');
        setShowModal(false);
        setCreating({ name: '', email: '', password: '', school_id: '' });
        loadUsers();
      } catch (err: any) {
        showToast(err.message || 'Failed to create school admin', 'error');
      }
      return;
    }
    try {
      await userService.update(editing.id, values);
      showToast('User updated successfully', 'success');
      setShowModal(false);
      setEditing(null);
      loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user', 'error');
    }
  };

  const deactivate = async (u: User) => {
    Alert.alert('Deactivate User', `Are you sure you want to deactivate ${u.full_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate',
        style: 'destructive',
        onPress: async () => {
          try {
            await userService.deactivate(u.id);
            Alert.alert('Success', 'User deactivated successfully');
            loadUsers();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to deactivate user');
          }
        },
      },
    ]);
  };

  const getSchoolName = (schoolId?: string) => {
    if (!schoolId) return 'No School';
    const school = schools.find((s) => s.id === schoolId);
    return school?.name || 'Unknown School';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return colors.error[600];
      case 'admin':
        return colors.primary[600];
      case 'headmaster':
        return colors.warning[600];
      case 'teacher':
        return colors.success[600];
      default:
        return colors.text.secondary;
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesQuery =
      u.full_name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      u.role.toLowerCase().includes(query.toLowerCase());
    const matchesSchool = selectedSchool === 'all' || u.school_id === selectedSchool;
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    return matchesQuery && matchesSchool && matchesRole;
  });

  if (loading && users.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Users</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Users</Text>
          <Text style={styles.subtitle}>Manage users across all schools</Text>
        </View>
        <Button
          title="Add User"
          onPress={() => {
            setEditing(null);
            setShowModal(true);
          }}
        />
      </View>

      <View style={styles.toolbar}>
        <Input
          label="Search"
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, email, or role"
        />
        <View style={styles.filters}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowSchoolModal(true)}
          >
            <View style={styles.filterButtonContent}>
              <Text style={styles.filterLabel}>School:</Text>
              <Text style={styles.filterValue}>
                {selectedSchool === 'all' ? 'All Schools' : schools.find((s) => s.id === selectedSchool)?.name || 'All Schools'}
              </Text>
            </View>
            <ChevronDown size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowRoleModal(true)}
          >
            <View style={styles.filterButtonContent}>
              <Text style={styles.filterLabel}>Role:</Text>
              <Text style={styles.filterValue}>
                {selectedRole === 'all' ? 'All Roles' : selectedRole.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
            </View>
            <ChevronDown size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No users found"
            message={query || selectedSchool !== 'all' || selectedRole !== 'all' ? 'Try adjusting your filters' : 'No users available.'}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadUsers();
              setRefreshing(false);
            }}
          />
        }
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View style={styles.rowContent}>
              <View style={styles.iconContainer}>
                <UsersIcon size={24} color={colors.primary[600]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.full_name}</Text>
                <View style={styles.rowMeta}>
                  <View style={styles.metaItem}>
                    <Mail size={14} color={colors.text.secondary} />
                    <Text style={styles.rowSub}>{item.email}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Shield size={14} color={getRoleColor(item.role)} />
                    <Text style={[styles.rowSub, { color: getRoleColor(item.role), textTransform: 'capitalize' }]}>
                      {item.role.replace('_', ' ')}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Building2 size={14} color={colors.text.secondary} />
                    <Text style={styles.rowSub}>{getSchoolName(item.school_id)}</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => { setEditing(item); setShowModal(true); }}>
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              {item.role !== 'super_admin' && (
                <TouchableOpacity onPress={() => deactivate(item)}>
                  <Text style={[styles.actionText, { color: colors.error[500] }]}>Deactivate</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )}
      />

      <Modal visible={showModal} onRequestClose={() => setShowModal(false)}>
        <Text style={styles.modalTitle}>{editing ? 'Edit User' : 'Create School Admin'}</Text>
        {editing ? (
          <UserForm initial={editing || undefined} onSubmit={onSave} schools={schools} />
        ) : (
          <>
            <Input
              label="Full Name"
              value={creating.name}
              onChangeText={(v) => setCreating({ ...creating, name: v })}
              placeholder="Enter full name"
              style={{ marginBottom: spacing.md }}
            />
            <Input
              label="Email"
              value={creating.email}
              onChangeText={(v) => setCreating({ ...creating, email: v })}
              placeholder="Enter email"
              autoCapitalize="none"
              keyboardType="email-address"
              style={{ marginBottom: spacing.md }}
            />
            <Input
              label="Password"
              value={creating.password}
              onChangeText={(v) => setCreating({ ...creating, password: v })}
              placeholder="Enter temporary password"
              secureTextEntry
              style={{ marginBottom: spacing.md }}
            />
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowSchoolModal(true)}
            >
              <View style={styles.filterButtonContent}>
                <Text style={styles.filterLabel}>School</Text>
                <Text style={styles.filterValue}>
                  {creating.school_id ? (schools.find((s) => s.id === creating.school_id)?.name || '') : 'Select school'}
                </Text>
              </View>
              <ChevronDown size={20} color={colors.text.secondary} />
            </TouchableOpacity>

            <Button
              title="Create Admin"
              onPress={() => onSave(null)}
              style={{ marginTop: spacing.md }}
            />
          </>
        )}
        <Button
          title="Close"
          variant="outline"
          onPress={() => setShowModal(false)}
          style={{ marginTop: spacing.md }}
        />
      </Modal>

      {/* School Filter Modal */}
      <RNModal
        visible={showSchoolModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSchoolModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select School</Text>
            <TouchableOpacity
              style={[styles.modalOption, selectedSchool === 'all' && styles.modalOptionActive]}
              onPress={() => {
                setSelectedSchool('all');
                setShowSchoolModal(false);
              }}
            >
              <Text style={[styles.modalOptionText, selectedSchool === 'all' && styles.modalOptionTextActive]}>
                All Schools
              </Text>
            </TouchableOpacity>
            {schools.map((school) => (
              <TouchableOpacity
                key={school.id}
                style={[styles.modalOption, (selectedSchool === school.id || creating.school_id === school.id) && styles.modalOptionActive]}
                onPress={() => {
                  if (editing) {
                    setSelectedSchool(school.id);
                  } else {
                    setCreating({ ...creating, school_id: school.id });
                  }
                  setShowSchoolModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, (selectedSchool === school.id || creating.school_id === school.id) && styles.modalOptionTextActive]}>
                  {school.name}
                </Text>
              </TouchableOpacity>
            ))}
            <Button
              title="Close"
              variant="outline"
              onPress={() => setShowSchoolModal(false)}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </RNModal>

      {/* Role Filter Modal */}
      <RNModal
        visible={showRoleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Role</Text>
            {['all', 'super_admin', 'admin', 'headmaster', 'teacher', 'student'].map((role) => (
              <TouchableOpacity
                key={role}
                style={[styles.modalOption, selectedRole === role && styles.modalOptionActive]}
                onPress={() => {
                  setSelectedRole(role);
                  setShowRoleModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, selectedRole === role && styles.modalOptionTextActive]}>
                  {role === 'all' ? 'All Roles' : role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
            <Button
              title="Close"
              variant="outline"
              onPress={() => setShowRoleModal(false)}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </RNModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary[600],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.inverse,
    marginBottom: spacing.xs / 2,
  },
  subtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.inverse,
    opacity: 0.9,
  },
  toolbar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    padding: spacing.sm,
    backgroundColor: colors.background.light,
  },
  filterButtonContent: {
    flex: 1,
  },
  filterLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
  },
  filterValue: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeights.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: hexToRgba(colors.background.dark ?? '#000000', 0.5),
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.light,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    maxHeight: '70%',
  },
  modalOption: {
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.xs,
    backgroundColor: colors.neutral[50],
  },
  modalOptionActive: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[600],
  },
  modalOptionText: {
    fontSize: typography.fontSizes.base,
    color: colors.text.primary,
  },
  modalOptionTextActive: {
    color: colors.primary[600],
    fontWeight: typography.fontWeights.semibold,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSizes.base,
    color: colors.text.secondary,
  },
  row: {
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rowTitle: {
    fontSize: typography.fontSizes.base,
    color: colors.text.primary,
    fontWeight: typography.fontWeights.semibold,
    marginBottom: spacing.xs,
  },
  rowMeta: {
    flexDirection: 'column',
    gap: spacing.xs / 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  rowSub: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  actionText: {
    color: colors.primary[600],
    fontWeight: typography.fontWeights.semibold,
    fontSize: typography.fontSizes.sm,
  },
  modalTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
});

