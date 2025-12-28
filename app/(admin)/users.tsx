import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/supabase/users';
import { User } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserForm } from '@/components/forms/UserForm';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { functionsService } from '@/services/supabase/functions';
import { ChevronDown } from 'lucide-react-native';
import { useToast } from '@/contexts/ToastContext';

export default function UsersScreen() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState({ name: '', email: '', password: '', role: 'teacher' as 'teacher' | 'headmaster' });
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const { showToast } = useToast();

  const load = async () => {
    const { data } = await userService.getAll(user?.school_id);
    setUsers(data || []);
  };

  useEffect(() => {
    load();
  }, [user?.school_id]);

  const onSave = async (values: any) => {
    if (!editing) {
      // Create headmaster/teacher via edge function
      if (!creating.name || !creating.email || !creating.password || !creating.role) {
        Alert.alert('Missing Fields', 'Please provide name, email, password and role.');
        return;
      }
      try {
        const result = await functionsService.createSchoolUser({
          name: creating.name,
          email: creating.email,
          password: creating.password,
          role: creating.role,
        });
        if (result.error) {
          showToast(result.error.message || 'Failed to create user', 'error');
          return;
        }
        showToast('User created successfully.', 'success');
        setShowModal(false);
        setCreating({ name: '', email: '', password: '', role: 'teacher' });
        load();
      } catch (err: any) {
        showToast(err.message || 'Failed to create user', 'error');
      }
      return;
    }
    await userService.update(editing.id, values);
    setShowModal(false);
    setEditing(null);
    load();
    showToast('User updated successfully.', 'success');
  };

  const deactivate = async (u: User) => {
    await userService.deactivate(u.id);
    load();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <Button title="Add User" onPress={() => { setEditing(null); setShowModal(true); }} />
      </View>

      <View style={styles.toolbar}>
        <Input
          label="Search"
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, email, or role"
        />
      </View>

      <FlatList<User>
        data={users.filter(u => (
          u.full_name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase()) ||
          u.role.toLowerCase().includes(query.toLowerCase())
        ))}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="No users" message={'Invite users in Supabase Auth, then edit profiles here.'} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        renderItem={({ item }: { item: User }) => (
          <Card style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.full_name}</Text>
              <Text style={styles.rowSub}>{item.email} • {item.role}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => { setEditing(item); setShowModal(true); }}>
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deactivate(item)}>
                <Text style={[styles.actionText, { color: colors.error[500] }]}>Deactivate</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />

      <Modal visible={showModal} onRequestClose={() => setShowModal(false)}>
        <Text style={styles.modalTitle}>{editing ? 'Edit User' : 'Create User'}</Text>
        {editing ? (
          <UserForm initial={editing || undefined} onSubmit={onSave} />
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
              style={{
                borderWidth: 1,
                borderColor: colors.neutral[300],
                borderRadius: 8,
                backgroundColor: colors.background.light,
                padding: spacing.sm,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onPress={() => {
                Alert.alert('Select Role', undefined, [
                  { text: 'Teacher', onPress: () => setCreating({ ...creating, role: 'teacher' }) },
                  { text: 'Headmaster', onPress: () => setCreating({ ...creating, role: 'headmaster' }) },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}
            >
              <View>
                <Text style={{ fontSize: typography.fontSizes.xs, color: colors.text.secondary }}>Role</Text>
                <Text style={{ fontSize: typography.fontSizes.sm, color: colors.text.primary, fontWeight: typography.fontWeights.medium }}>
                  {creating.role === 'teacher' ? 'Teacher' : 'Headmaster'}
                </Text>
              </View>
              <ChevronDown size={20} color={colors.text.secondary} />
            </TouchableOpacity>

            <Button
              title="Create User"
              onPress={() => onSave(null)}
              style={{ marginTop: spacing.md }}
            />
          </>
        )}
        <Button title="Close" variant="outline" onPress={() => setShowModal(false)} style={{ marginTop: spacing.md }} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
    padding: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary[600],
    borderRadius: 8,
    margin: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.inverse,
  },
  list: {
    paddingHorizontal: spacing.md,
  },
  toolbar: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  rowTitle: {
    fontSize: typography.fontSizes.base,
    color: colors.text.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  rowSub: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center',
  },
  actionText: {
    color: colors.primary[600],
    fontWeight: typography.fontWeights.semibold,
  },
  empty: {
    textAlign: 'center',
    color: colors.text.secondary,
    marginTop: spacing['2xl'],
  },
  modalTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
});
