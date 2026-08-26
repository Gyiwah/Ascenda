import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '@/utils/useAuth';
import { studentApiService, StudentReportCardSummary } from '@/api/student';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { StudentUser } from '@/types/database';
import { FileText, Share2, Printer, Award, Calendar, CheckCircle } from 'lucide-react-native';

export default function StudentReportCardsScreen() {
  const { user } = useAuth();
  const theme = useAppTheme();
  const { showToast } = useToast();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const student = user as StudentUser | null;
  const [reports, setReports] = useState<StudentReportCardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    loadReports();
  }, [student?.id]);

  const loadReports = async () => {
    if (!student?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data } = await studentApiService.getStudentReportCards(student.id);
      setReports(data || []);
    } catch (err: any) {
      showToast('Error loading report cards', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async (report: StudentReportCardSummary) => {
    try {
      setPrinting(true);
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px; }
            .school-name { font-size: 24px; font-weight: bold; color: #1e3a8a; }
            .report-title { font-size: 18px; margin-top: 6px; color: #475569; }
            .info-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
            .info-table td { padding: 6px 12px; font-size: 14px; border: 1px solid #e2e8f0; }
            .summary-box { background-color: #f8fafc; padding: 16px; border-radius: 8px; margin-top: 16px; }
            .remarks { margin-top: 20px; font-style: italic; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-name">Terminal Assessment Report</div>
            <div class="report-title">Academic Year ${report.academic_year || 'Current'} — Term ${report.term || 1}</div>
          </div>
          <table class="info-table">
            <tr>
              <td><strong>Student Name:</strong> ${student?.full_name || 'N/A'}</td>
              <td><strong>Admission No:</strong> ${student?.admission_number || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Total Score:</strong> ${report.total_score || 0}</td>
              <td><strong>Average:</strong> ${report.average_score || 0}%</td>
            </tr>
            <tr>
              <td><strong>Class Position:</strong> ${report.position ? report.position + ' of ' + (report.total_students || '') : 'N/A'}</td>
              <td><strong>Attendance:</strong> ${report.attendance_present || 0} / ${report.attendance_total || 0} days</td>
            </tr>
          </table>
          <div class="summary-box">
            <div class="remarks"><strong>Class Teacher Remarks:</strong> ${report.class_teacher_remarks || 'Satisfactory academic performance.'}</div>
            <div class="remarks" style="margin-top: 10px;"><strong>Headmaster Remarks:</strong> ${report.headmaster_remarks || 'Promoted with commendable progress.'}</div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        await Print.printAsync({ uri });
      }
    } catch (err: any) {
      Alert.alert('Print Error', err?.message || 'Failed to export report card');
    } finally {
      setPrinting(false);
    }
  };

  if (loading && reports.length === 0) {
    return <Loader />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await loadReports();
            setRefreshing(false);
          }}
          tintColor={theme.colors.primary.base}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Terminal Report Cards</Text>
        <Text style={styles.subtitle}>
          Official end-of-term academic reports and performance certificates
        </Text>
      </View>

      {reports.length === 0 ? (
        <EmptyState
          title="No published report cards"
          message="Terminal report cards will appear here once approved and published by the administration."
        />
      ) : (
        reports.map((report) => (
          <Card key={report.id} style={styles.reportCard}>
            <View style={styles.cardTop}>
              <View style={styles.termBadge}>
                <Calendar size={14} color={theme.colors.primary.base} />
                <Text style={styles.termText}>
                  Term {report.term} • {report.academic_year}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <CheckCircle size={12} color={theme.colors.success.base} />
                <Text style={styles.statusText}>Published</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Total Score</Text>
                <Text style={styles.statValue}>{report.total_score}</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Average</Text>
                <Text style={[styles.statValue, { color: theme.colors.primary.base }]}>
                  {report.average_score}%
                </Text>
              </View>
              {!!report.position && (
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Position</Text>
                  <Text style={[styles.statValue, { color: theme.colors.accent.base }]}>
                    #{report.position}
                  </Text>
                </View>
              )}
            </View>

            {!!report.class_teacher_remarks && (
              <View style={styles.remarksBox}>
                <Text style={styles.remarksTitle}>Teacher's Remarks</Text>
                <Text style={styles.remarksContent}>{report.class_teacher_remarks}</Text>
              </View>
            )}

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handlePrint(report)}
                disabled={printing}
              >
                <Share2 size={16} color={theme.colors.primary.base} />
                <Text style={styles.actionButtonText}>Export / Print PDF</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))
      )}
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
      gap: theme.spacing.md,
    },
    header: {
      marginBottom: theme.spacing.xs,
    },
    title: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
    },
    subtitle: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginTop: 4,
    },
    reportCard: {
      padding: theme.spacing.md,
      gap: theme.spacing.md,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    termBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primary.base + '1A',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radii.sm,
    },
    termText: {
      fontSize: theme.typography.fontSizes.xs,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.primary.base,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusText: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.success.base,
      fontWeight: theme.typography.fontWeights.medium,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: theme.colors.background.secondary,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radii.md,
    },
    statCol: {
      alignItems: 'center',
    },
    statLabel: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
      marginBottom: 2,
    },
    statValue: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
    },
    remarksBox: {
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.surface.secondary,
      borderRadius: theme.radii.sm,
    },
    remarksTitle: {
      fontSize: theme.typography.fontSizes.xs,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.secondary,
      marginBottom: 2,
    },
    remarksContent: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.primary,
      fontStyle: 'italic',
    },
    cardActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.sm,
    },

    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 6,
      borderRadius: theme.radii.sm,
      backgroundColor: theme.colors.primary.base + '1A',
    },
    actionButtonText: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.primary.base,
    },
  });
