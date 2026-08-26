import React, { useMemo } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/theme';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: any;
  autoCorrect?: boolean;
  style?: any;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
  autoCorrect = true,
  style,
  multiline = false,
  numberOfLines = 1,
  editable = true,
}: InputProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, style]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.muted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={autoCorrect}
        multiline={multiline}
        numberOfLines={numberOfLines}
        editable={editable}
      />
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
      color: theme.colors.text.label,
      marginBottom: theme.spacing.xs,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.roundness ? theme.roundness / 1.5 : 8,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.surface.primary,
    },
  });


