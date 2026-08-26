import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/theme';

export default function TeacherClassesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Classrooms</Text>
      <Text style={styles.subtitle}>View your classroom assignments</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSizes.base,
    color: colors.text.secondary,
  },
});
