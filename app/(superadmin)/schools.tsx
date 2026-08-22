import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/theme';
import { schoolService } from '@/services/supabase/schools';
import { School } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SchoolForm } from '@/components/forms/SchoolForm';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { School as SchoolIcon, MapPin, Hash } from 'lucide-react-native';

export default function SchoolsScreen() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<School | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await schoolService.getAll();
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSchools(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async (values: any) => {
    try {
      if (editing) {
        const { error } = await schoolService.update(editing.id, values);
        if (error) throw error;
        Alert.alert('Success', 'School updated successfully');
      } else {
        const { error } = await schoolService.create(values);
        if (error) throw error;
        Alert.alert('Success', 'School created successfully');
      }
      setShowModal(false);
      setEditing(null);
      load();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save school');
    }
  };

  const onDelete = (school: School) => {
    Alert.alert(
      'Delete School',
      `Are you sure you want to delete ${school.name}? This will deactivate the school.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await schoolService.delete(school.id);
              if (error) throw error;
              Alert.alert('Success', 'School deactivated successfully');
              load();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete school');
            }
          },
        },
      ]
    );
  };

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(query.toLowerCase())) ||
      (s.address && s.address.toLowerCase().includes(query.toLowerCase()))
  );

  if (loading && schools.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Schools</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading schools...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Schools</Text>
        <Button title="Add School" onPress={() => { setEditing(null); setShowModal(true); }} />
      </View>

      <View style={styles.toolbar}>
        <Input
          label="Search"
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, code, or address"
        />
      </View>

      <FlatList
        data={filteredSchools}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No schools found"
            message={query ? 'Try adjusting your search' : 'Tap "Add School" to create your first school.'}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/(superadmin)/school-details?id=${item.id}`)}
            activeOpacity={0.7}
          >
            <Card style={styles.row}>
              <View style={styles.rowContent}>
                <View style={styles.iconContainer}>
                  <SchoolIcon size={24} color={colors.primary[600]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <View style={styles.rowMeta}>
                    <View style={styles.metaItem}>
                      <Hash size={14} color={colors.text.secondary} />
                      <Text style={styles.rowSub}>{item.code}</Text>
                    </View>
                    {item.address && (
                      <View style={styles.metaItem}>
                        <MapPin size={14} color={colors.text.secondary} />
                        <Text style={styles.rowSub} numberOfLines={1}>
                          {item.address}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setEditing(item);
                    setShowModal(true);
                  }}
                >
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                  }}
                >
                  <Text style={[styles.actionText, { color: colors.error[500] }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />

      <Modal visible={showModal} onRequestClose={() => setShowModal(false)}>
        <Text style={styles.modalTitle}>{editing ? 'Edit School' : 'Add School'}</Text>
        <SchoolForm initial={editing || undefined} onSubmit={onSave} />
        <Button
          title="Close"
          variant="outline"
          onPress={() => setShowModal(false)}
          style={{ marginTop: spacing.md }}
        />
      </Modal>
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
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.inverse,
  },
  toolbar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
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
