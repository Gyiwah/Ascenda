import React, { useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { GradeBadge } from './GradeBadge';
import { computeGrade, DEFAULT_GRADE_BANDS } from '@/utils/computeGrade';
import { Student } from '@/types/database';

interface ScoreInputRowProps {
  student: Student;
  caScore: string;
  examScore: string;
  totalScore: number;
  grade: string;
  onCAScoreChange: (value: string) => void;
  onExamScoreChange: (value: string) => void;
  onCAScoreBlur?: (value: string) => void;
  onExamScoreBlur?: (value: string) => void;
  caMax?: number;
  examMax?: number;
  disabled?: boolean;
}

export type ScoreInputRowHandle = {
  focusCA: () => void;
  focusExam: () => void;
};

export const ScoreInputRow = forwardRef<ScoreInputRowHandle, ScoreInputRowProps>(
  function ScoreInputRowComponent(props, ref) {
    const {
      student,
      caScore,
      examScore,
      totalScore,
      grade,
      onCAScoreChange,
      onExamScoreChange,
      onCAScoreBlur,
      onExamScoreBlur,
      caMax = 40,
      examMax = 60,
      disabled = false,
    } = props;
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const caRef = useRef<TextInput | null>(null);
  const examRef = useRef<TextInput | null>(null);

  useImperativeHandle(ref, () => ({
    focusCA: () => caRef.current?.focus?.(),
    focusExam: () => examRef.current?.focus?.(),
  }));

  // Validation
  const caNum = parseFloat(caScore) || 0;
  const examNum = parseFloat(examScore) || 0;
  const caInvalid = caNum < 0 || caNum > caMax;
  const examInvalid = examNum < 0 || examNum > examMax;

  // Auto-compute total and grade when scores change
  // Use default grade bands since this component doesn't have access to school config
  const computedTotal = caNum + examNum;
  const computedGrade = computedTotal === 0 ? '' : computeGrade(computedTotal, DEFAULT_GRADE_BANDS);
  const displayTotal = totalScore || computedTotal;
  const displayGrade = grade || computedGrade;

  return (
    <View style={styles.row}>
      {/* Student Info on Top */}
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>
          {student.first_name} {student.last_name}
        </Text>
        <Text style={styles.admissionNumber}>{student.admission_number}</Text>
      </View>

      {/* Score Fields Below */}
      <View style={styles.scoresContainer}>
        <View style={styles.scoreInput}>
          <Text style={styles.scoreLabel}>CA</Text>
          <TextInput
            ref={caRef}
            style={[styles.input, disabled && styles.inputDisabled, caInvalid && styles.inputInvalid]}
            value={caScore}
            onChangeText={onCAScoreChange}
            onBlur={() => onCAScoreBlur && onCAScoreBlur(caScore)}
            keyboardType="numeric"
            placeholder={`0-${caMax}`}
            editable={!disabled}
            maxLength={3}
            returnKeyType="next"
            onSubmitEditing={() => examRef.current?.focus?.()}
          />
          {caInvalid && (
            <Text style={styles.invalidText}>Max: {caMax}</Text>
          )}
        </View>

        <View style={styles.scoreInput}>
          <Text style={styles.scoreLabel}>Exam</Text>
          <TextInput
            ref={examRef}
            style={[styles.input, disabled && styles.inputDisabled, examInvalid && styles.inputInvalid]}
            value={examScore}
            onChangeText={onExamScoreChange}
            onBlur={() => onExamScoreBlur && onExamScoreBlur(examScore)}
            keyboardType="numeric"
            placeholder={`0-${examMax}`}
            editable={!disabled}
            maxLength={3}
            returnKeyType="done"
          />
          {examInvalid && (
            <Text style={styles.invalidText}>Max: {examMax}</Text>
          )}
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{displayTotal.toFixed(1)}</Text>
        </View>

        <View style={styles.gradeContainer}>
          {displayGrade && <GradeBadge grade={displayGrade} size="md" />}
        </View>
      </View>
    </View>
  );
  }
);

const makeStyles = (theme: any) =>
  StyleSheet.create({
    row: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
      backgroundColor: theme.colors.surface.primary,
    },
    studentInfo: {
      marginBottom: theme.spacing.md,
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
    scoresContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
    },
    scoreInput: {
      width: 60,
      alignItems: 'center',
    },
    scoreLabel: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs / 2,
    },
    input: {
      width: '100%',
      height: 40,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.roundness / 2,
      paddingHorizontal: theme.spacing.sm,
      textAlign: 'center',
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.background.primary,
    },
    inputInvalid: {
      borderColor: theme.colors.error.base,
      backgroundColor: theme.colors.error.base + '1A',
    },
    inputDisabled: {
      backgroundColor: theme.colors.surface.secondary,
      color: theme.colors.text.secondary,
    },
    invalidText: {
      color: theme.colors.error.base,
      fontSize: theme.typography.fontSizes.xs,
      marginTop: 2,
      textAlign: 'center',
    },
    totalContainer: {
      width: 60,
      alignItems: 'center',
    },
    totalLabel: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs / 2,
    },
    totalValue: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    gradeContainer: {
      width: 50,
      alignItems: 'center',
    },
  });

