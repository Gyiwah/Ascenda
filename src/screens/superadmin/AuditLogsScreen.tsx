import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/database/client';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';

const ITEMS_PER_PAGE = 20;

type AuditLog = {
  id: string;
  action: string;
  table_name: string;
  user_id: string | null;
  new_data?: Record<string, unknown>;
  created_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
};

export default function AuditLogsScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setLogs((data as AuditLog[]) || []);
      setPage(0);
    } catch (err: any) {
      console.error('Error loading audit logs', err);
      showToast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter((log) => {
      const values = [log.action, log.table_name, log.user_id ?? '', log.ip_address ?? ''];
      return values.some((value) => value.toLowerCase().includes(q));
    });
  }, [logs, searchQuery]);

  const paginatedLogs = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, page]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Audit Logs</Text>
          <Text style={styles.subtitle}>{filteredLogs.length} entries</Text>
        </View>
        <Button title="Refresh" onPress={loadLogs} />
      </View>

      <Input
        label="Search"
        placeholder="Search by action, table, user, or IP"
        value={searchQuery}
        onChangeText={(q) => {
          setSearchQuery(q);
          setPage(0);
        }}
        style={styles.searchInput}
      />

      {paginatedLogs.map((log) => {
        const prettyJson =
          log.new_data && typeof log.new_data === 'object'
            ? JSON.stringify(log.new_data, null, 2)
            : null;

        return (
          <Card key={log.id} style={styles.logCard}>
            <View style={styles.logHeader}>
              <Text style={styles.logAction}>{log.action}</Text>
              <Text style={styles.logTable}>{log.table_name}</Text>
            </View>

            <Text style={styles.logMeta}>
              {formatDate(log.created_at)} • User: {log.user_id || 'N/A'}
            </Text>

            {prettyJson ? (
              <View style={styles.dataSection}>
                <Text style={styles.dataLabel}>New data</Text>
                <Text style={styles.dataValue}>{prettyJson}</Text>
              </View>
            ) : null}

            {log.ip_address ? (
              <Text style={styles.logMeta}>
                IP: {log.ip_address} {log.user_agent ? `• ${log.user_agent}` : ''}
              </Text>
            ) : null}
          </Card>
        );
      })}

      {filteredLogs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No audit logs found</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your search or refresh the page.</Text>
        </View>
      ) : null}

      {filteredLogs.length > ITEMS_PER_PAGE ? (
        <View style={styles.pagination}>
          <Button
            title="Previous"
            variant="outline"
            onPress={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={page === 0}
          />
          <Text style={styles.pageIndicator}>
            Page {page + 1} of {totalPages}
          </Text>
          <Button
            title="Next"
            variant="outline"
            onPress={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={page >= totalPages - 1}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    content: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing['2xl'],
      gap: theme.spacing.lg,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
      marginTop: theme.spacing.sm,
    },
    logCard: {
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.roundness,
      padding: theme.spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary.base,
      shadowColor: theme.colors.background.dark ?? '#000',
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
      gap: theme.spacing.sm,
    },
    logHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    logAction: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.primary.base,
    },
    logTable: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.accent.base,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.roundness / 2,
      backgroundColor: theme.colors.accent.base + '1A',
    },
    logMeta: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    dataSection: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.roundness,
      padding: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    dataLabel: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    dataValue: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
      fontFamily: 'monospace',
    },
    emptyState: {
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    emptyTitle: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.colors.text.primary,
    },
    emptySubtitle: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      maxWidth: 260,
    },
    pagination: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.spacing.sm,
    },
    pageIndicator: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
  });
