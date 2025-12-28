import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { auditService } from '@/services/supabase/audit';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Activity, Clock, User, FileText } from 'lucide-react-native';

export default function AuditLogsScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await auditService.getAll(200);
    if (error) {
      console.error('Error loading audit logs:', error);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'insert':
        return colors.success[600];
      case 'update':
        return colors.warning[600];
      case 'delete':
        return colors.error[600];
      default:
        return colors.primary[600];
    }
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.action?.toLowerCase().includes(query.toLowerCase()) ||
      log.table_name?.toLowerCase().includes(query.toLowerCase()) ||
      log.user?.full_name?.toLowerCase().includes(query.toLowerCase()) ||
      log.user?.email?.toLowerCase().includes(query.toLowerCase())
  );

  if (loading && logs.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Audit Logs</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading audit logs...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Audit Logs</Text>
        <Text style={styles.subtitle}>System activity tracking</Text>
      </View>

      <View style={styles.toolbar}>
        <Input
          label="Search"
          value={query}
          onChangeText={setQuery}
          placeholder="Search by action, table, or user"
        />
      </View>

      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No audit logs found"
            message={query ? 'Try adjusting your search' : 'No activity logs available.'}
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
          <Card style={styles.row}>
            <View style={styles.rowHeader}>
              <View style={[styles.actionBadge, { backgroundColor: getActionColor(item.action) + '20' }]}>
                <Activity size={16} color={getActionColor(item.action)} />
                <Text style={[styles.actionText, { color: getActionColor(item.action) }]}>
                  {item.action?.toUpperCase()}
                </Text>
              </View>
              <View style={styles.dateContainer}>
                <Clock size={14} color={colors.text.secondary} />
                <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
              </View>
            </View>

            <View style={styles.rowContent}>
              <View style={styles.infoRow}>
                <FileText size={16} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Table:</Text>
                <Text style={styles.infoValue}>{item.table_name}</Text>
              </View>

              {item.user && (
                <View style={styles.infoRow}>
                  <User size={16} color={colors.text.secondary} />
                  <Text style={styles.infoLabel}>User:</Text>
                  <Text style={styles.infoValue}>
                    {item.user.full_name} ({item.user.role})
                  </Text>
                </View>
              )}

              {item.record_id && (
                <Text style={styles.recordId}>Record ID: {item.record_id.substring(0, 8)}...</Text>
              )}
            </View>
          </Card>
        )}
      />
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
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
  },
  actionText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    textTransform: 'uppercase',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  dateText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
  },
  rowContent: {
    gap: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  infoLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeights.medium,
  },
  infoValue: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.primary,
    flex: 1,
  },
  recordId: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    marginTop: spacing.xs / 2,
  },
});

