import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, typography } from '@/theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ascenda</Text>
      <ActivityIndicator size="large" color={colors.primary[600]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.light,
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.primary[700],
    marginBottom: spacing.lg,
  },
});

