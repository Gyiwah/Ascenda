import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppTheme } from '@/theme';

interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
  fullscreen?: boolean;
}

export function Loader({ size = 'large', color, fullscreen = true }: LoaderProps) {
  const theme = useAppTheme();
  return (
    <View style={[styles.container, fullscreen && { backgroundColor: theme?.colors?.background?.primary ?? '#ffffff' }]}>
      <ActivityIndicator size={size} color={color || (theme?.colors?.primary?.base ?? '#e16510')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


