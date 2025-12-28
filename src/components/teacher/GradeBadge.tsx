import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { getGradeColor, getGradeBgColor } from '@/utils/computeGrade';

interface GradeBadgeProps {
  grade: string;
  size?: 'sm' | 'md' | 'lg';
}

export function GradeBadge({ grade, size = 'md' }: GradeBadgeProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme, size), [theme, size]);
  
  const gradeColor = getGradeColor(grade);
  const bgColor = getGradeBgColor(grade);

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.gradeText, { color: gradeColor }]}>
        {grade.toUpperCase()}
      </Text>
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>, size: 'sm' | 'md' | 'lg') =>
  StyleSheet.create({
    badge: {
      paddingHorizontal: size === 'sm' ? theme.spacing.sm : size === 'lg' ? theme.spacing.md : theme.spacing.sm,
      paddingVertical: size === 'sm' ? theme.spacing.xs / 2 : size === 'lg' ? theme.spacing.sm : theme.spacing.xs,
      borderRadius: theme.roundness,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: size === 'sm' ? 32 : size === 'lg' ? 48 : 40,
    },
    gradeText: {
      fontSize: 
        size === 'sm' ? theme.typography.fontSizes.xs :
        size === 'lg' ? theme.typography.fontSizes.base :
        theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.bold,
    },
  });

