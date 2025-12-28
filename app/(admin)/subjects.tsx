import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { subjectService } from '@/services/supabase/subjects';
import { Subject } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SubjectForm } from '@/components/forms/SubjectForm';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';

export default function SubjectsScreen() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const load = async () => {
    if (!user?.school_id) return;
    setLoading(true);
    const { data } = await subjectService.getAll(user.school_id);
    setSubjects(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.school_id]);

  const onSave = async (values: any) => {
    if (!user?.school_id) return;
    if (editing) {
      await subjectService.update(editing.id, values);
    } else {
      await subjectService.create({ ...values, school_id: user.school_id, created_at: new Date().toISOString() } as any);
    }
    setShowModal(false);
    setEditing(null);
    load();
  };

  const onDelete = (subject: Subject) => {
    Alert.alert('Delete Subject', `Delete ${subject.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await subjectService.delete(subject.id); load(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}> 
        <Text style={styles.title}>Subjects</Text>
        <Button title="Add Subject" onPress={() => { setEditing(null); setShowModal(true); }} />
      </View>

      <View style={styles.toolbar}>
        <Input
          label="Search"
          value={query}
          onChangeText={setQuery}
          placeholder="Search subjects by name or code"
        />
      </View>

      <FlatList<Subject>
        data={subjects.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.code.toLowerCase().includes(query.toLowerCase()))}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="No subjects" message={'Tap "Add Subject" to create your first subject.'} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        renderItem={({ item }: { item: Subject }) => (
          <Card style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.name}</Text>
              <Text style={styles.rowSub}>{item.code}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => { setEditing(item); setShowModal(true); }}>
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(item)}>
                <Text style={[styles.actionText, { color: colors.error[500] }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />

      <Modal visible={showModal} onRequestClose={() => setShowModal(false)}>
        <Text style={styles.modalTitle}>{editing ? 'Edit Subject' : 'Add Subject'}</Text>
        <SubjectForm initial={editing || undefined} onSubmit={onSave} />
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
