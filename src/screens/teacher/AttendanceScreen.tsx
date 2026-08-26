import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/utils/useAuth';
import { classService } from '@/api/classes';
import { attendanceService, AttendanceRecord, AttendanceStatus } from '@/api/attendance';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Picker } from '@/components/ui/Picker';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { CheckCircle2, XCircle, Clock, AlertCircle, Calendar, Users } from 'lucide-react-native';
import { Class } from '@/types/database';

export default function AttendanceScreen() {
  const { user } = useAuth();
  const theme = useAppTheme();
  const { showToast } = useToast();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load classrooms for the teacher/school
  useEffect(() => {
    loadClasses();
  }, [user?.school_id]);

  const loadClasses = async () => {
    if (!user?.school_id) return;
    try {
      setLoading(true);
      const { data } = await classService.getAll(user.school_id);
      if (data && data.length > 0) {
        setClasses(data);
        setSelectedClassId(data[0].id);
      }
    } catch (err: any) {
      showToast('Failed to load classrooms', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load attendance when selected class changes
  useEffect(() => {
    if (selectedClassId && user?.school_id) {
      loadAttendance(selectedClassId, selectedDate);
    }
  }, [selectedClassId, selectedDate, user?.school_id]);

  const loadAttendance = async (classId: string, date: string) => {
    if (!user?.school_id) return;
    try {
      setLoading(true);
      const { data, error } = await attendanceService.getClassAttendance(
        classId,
        date,
        user.school_id
      );
      if (error) {
        showToast('Failed to load student roster', 'error');
      } else {
        setRecords(data || []);
      }
    } catch (err: any) {
      showToast('Error loading attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, status } : r))
    );
  };

  const handleMarkAllPresent = () => {
    setRecords((prev) => prev.map((r) => ({ ...r, status: 'present' })));
    showToast('All students marked present', 'info');
  };

  const handleSave = async () => {
    if (records.length === 0) return;
    setSaving(true);
    try {
      const { error } = await attendanceService.submitClassAttendance(records);
      if (error) throw error;
      showToast('Attendance recorded successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save attendance', 'error');
    } finally {
      setSaving(false);
    }
  };

  const classOptions = useMemo(() => {
    return classes.map((c) => ({
      label: `${c.name} (${c.academic_year})`,
      value: c.id,
    }));
  }, [classes]);

  const stats = useMemo(() => {
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const excused = records.filter((r) => r.status === 'excused').length;
    return { present, absent, late, excused, total: records.length };
  }, [records]);

  if (loading && classes.length === 0) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      {/* Controls Header */}
      <View style={styles.header}>
        <View style={styles.selectorRow}>
          <View style={{ flex: 1 }}>
            <Picker
              label="Classroom"
              value={selectedClassId}
              onValueChange={setSelectedClassId}
              options={classOptions}
              placeholder="Select classroom"
            />
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.dateBadge}>
            <Calendar size={16} color={theme.colors.primary.base} />
            <Text style={styles.dateText}>Date: {selectedDate}</Text>
          </View>
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={handleMarkAllPresent}
          >
            <Text style={styles.markAllText}>Mark All Present</Text>
          </TouchableOpacity>
        </View>

        {/* Attendance Summary Mini-Stats */}
        {records.length > 0 && (
          <View style={styles.summaryBar}>
            <View style={styles.statBadge}>
              <Text style={[styles.statVal, { color: theme.colors.success.base }]}>
                {stats.present}
              </Text>
              <Text style={styles.statLbl}>Present</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={[styles.statVal, { color: theme.colors.warn.base }]}>
                {stats.late}
              </Text>
              <Text style={styles.statLbl}>Late</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={[styles.statVal, { color: theme.colors.error.base }]}>
                {stats.absent}
              </Text>
              <Text style={styles.statLbl}>Absent</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={[styles.statVal, { color: theme.colors.accent.base }]}>
                {stats.excused}
              </Text>
              <Text style={styles.statLbl}>Excused</Text>
            </View>
          </View>
        )}
      </View>

      {/* Student List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAttendance(selectedClassId, selectedDate)}
            tintColor={theme.colors.primary.base}
          />
        }
      >
        {records.length === 0 ? (
          <EmptyState
            title="No students found"
            message="No active students enrolled in this classroom."
          />
        ) : (
          records.map((record, index) => {
            const isPresent = record.status === 'present';
            const isAbsent = record.status === 'absent';
            const isLate = record.status === 'late';
            const isExcused = record.status === 'excused';

            return (
              <Card key={record.student_id} style={styles.studentCard}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentIndex}>{index + 1}.</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>
                      {record.student_name || 'Unknown Student'}
                    </Text>
                    <Text style={styles.admissionNo}>
                      Adm: {record.admission_number || 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Status Selection Chips */}
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      isPresent && { backgroundColor: theme.colors.success.base },
                    ]}
                    onPress={() => handleStatusChange(record.student_id, 'present')}
                  >
                    <CheckCircle2
                      size={14}
                      color={isPresent ? '#fff' : theme.colors.success.base}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        isPresent && styles.activeChipText,
                      ]}
                    >
                      Present
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.chip,
                      isLate && { backgroundColor: theme.colors.warn.base },
                    ]}
                    onPress={() => handleStatusChange(record.student_id, 'late')}
                  >
                    <Clock
                      size={14}
                      color={isLate ? '#fff' : theme.colors.warn.base}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        isLate && styles.activeChipText,
                      ]}
                    >
                      Late
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.chip,
                      isAbsent && { backgroundColor: theme.colors.error.base },
                    ]}
                    onPress={() => handleStatusChange(record.student_id, 'absent')}
                  >
                    <XCircle
                      size={14}
                      color={isAbsent ? '#fff' : theme.colors.error.base}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        isAbsent && styles.activeChipText,
                      ]}
                    >
                      Absent
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.chip,
                      isExcused && { backgroundColor: theme.colors.accent.base },
                    ]}
                    onPress={() => handleStatusChange(record.student_id, 'excused')}
                  >
                    <AlertCircle
                      size={14}
                      color={isExcused ? '#fff' : theme.colors.accent.base}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        isExcused && styles.activeChipText,
                      ]}
                    >
                      Excused
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Footer Submit Button */}
      {records.length > 0 && (
        <View style={styles.footer}>
          <Button
            title="Save Attendance Register"
            onPress={handleSave}
            loading={saving}
          />
        </View>
      )}
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface.primary,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: theme.spacing.sm,
    },

    selectorRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    dateText: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.colors.text.secondary,
    },
    markAllBtn: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs / 2,
      borderRadius: theme.radii.sm,
      backgroundColor: theme.colors.primary.base + '1A',
    },
    markAllText: {
      fontSize: theme.typography.fontSizes.xs,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.primary.base,
    },
    summaryBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: theme.colors.background.secondary,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radii.md,
      marginTop: theme.spacing.xs,
    },
    statBadge: {
      alignItems: 'center',
    },
    statVal: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.bold,
    },
    statLbl: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.muted,
    },
    list: {
      flex: 1,
    },
    listContent: {
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    studentCard: {
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    studentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    studentIndex: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.muted,
      width: 24,
    },
    studentName: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    admissionNo: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
    },
    chipRow: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      justifyContent: 'space-between',
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: theme.radii.full,
      backgroundColor: theme.colors.background.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flex: 1,
      justifyContent: 'center',
    },
    chipText: {
      fontSize: 11,
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.colors.text.secondary,
    },
    activeChipText: {
      color: '#ffffff',
      fontWeight: theme.typography.fontWeights.bold,
    },
    footer: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface.primary,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
  });

