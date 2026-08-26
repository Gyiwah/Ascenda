import React, { useMemo } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { useAppTheme } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={theme.colors.text.muted}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    label: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.colors.text.label || theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.roundness ? theme.roundness / 1.5 : 8,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.surface.primary,
      minHeight: 44,
    },
    inputError: {
      borderColor: theme.colors.error.base,
    },
    errorText: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.error.base,
      marginTop: theme.spacing.xs,
    },
  });

