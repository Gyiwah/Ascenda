import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  const theme = useAppTheme();
  const dynamicStyles = useMemo(() => ({
    backgroundColor: theme?.colors?.surface?.primary ?? '#ffffff',
    borderColor: theme?.colors?.border ?? '#e0dfdc',
    shadowColor: theme?.colors?.background?.dark ?? '#000000',
  }), [theme]);

  return <View style={[styles.card, dynamicStyles, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});


