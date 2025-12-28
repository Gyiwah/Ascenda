import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/theme';

interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
}

export function Loader({ size = 'large', color = colors.primary[600] }: LoaderProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
