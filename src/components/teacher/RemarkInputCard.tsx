import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { Card } from '@/components/ui/Card';
import { Student } from '@/types/database';
import { MessageSquare } from 'lucide-react-native';

interface RemarkInputCardProps {
  student: Student;
  behaviorRemark?: string;
  performanceRemark?: string;
  attendanceRemark?: string;
  onBehaviorChange: (value: string) => void;
  onPerformanceChange: (value: string) => void;
  onAttendanceChange: (value: string) => void;
  disabled?: boolean;
  lastSaved?: string;
}

export function RemarkInputCard({
  student,
  behaviorRemark = '',
  performanceRemark = '',
  attendanceRemark = '',
  onBehaviorChange,
  onPerformanceChange,
  onAttendanceChange,
  disabled = false,
  lastSaved,
}: RemarkInputCardProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <MessageSquare size={20} color={theme.colors.primary.base} />
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {student.first_name} {student.last_name}
          </Text>
          <Text style={styles.admissionNumber}>{student.admission_number}</Text>
        </View>
      </View>

      <View style={styles.remarksContainer}>
        <View style={styles.remarkSection}>
          <Text style={styles.remarkLabel}>Behavior</Text>
          <TextInput
            style={[styles.textArea, disabled && styles.textAreaDisabled]}
            value={behaviorRemark}
            onChangeText={onBehaviorChange}
            placeholder="Enter behavior remark..."
            multiline
            numberOfLines={3}
            editable={!disabled}
            placeholderTextColor={theme.colors.text.muted}
          />
        </View>

        <View style={styles.remarkSection}>
          <Text style={styles.remarkLabel}>Performance</Text>
          <TextInput
            style={[styles.textArea, disabled && styles.textAreaDisabled]}
            value={performanceRemark}
            onChangeText={onPerformanceChange}
            placeholder="Enter performance remark..."
            multiline
            numberOfLines={3}
            editable={!disabled}
            placeholderTextColor={theme.colors.text.muted}
          />
        </View>

        <View style={styles.remarkSection}>
          <Text style={styles.remarkLabel}>Attendance</Text>
          <TextInput
            style={[styles.textArea, disabled && styles.textAreaDisabled]}
            value={attendanceRemark}
            onChangeText={onAttendanceChange}
            placeholder="Enter attendance remark..."
            multiline
            numberOfLines={3}
            editable={!disabled}
            placeholderTextColor={theme.colors.text.muted}
          />
        </View>
      </View>

      {lastSaved && (
        <Text style={styles.lastSaved}>Last saved: {lastSaved}</Text>
      )}
    </Card>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    card: {
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    studentInfo: {
      flex: 1,
    },
    studentName: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 2,
    },
    admissionNumber: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
    },
    remarksContainer: {
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    remarkSection: {
      gap: theme.spacing.xs,
    },
    remarkLabel: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.colors.text.secondary,
    },
    textArea: {
      minHeight: 80,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.roundness,
      padding: theme.spacing.md,
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.background.primary,
      textAlignVertical: 'top',
    },
    textAreaDisabled: {
      backgroundColor: theme.colors.surface.secondary,
      color: theme.colors.text.muted,
    },
    lastSaved: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.muted,
      marginBottom: theme.spacing.sm,
      fontStyle: 'italic',
    },
    submitButton: {
      marginTop: theme.spacing.sm,
    },
  });

