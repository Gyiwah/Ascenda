import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  icon?: React.ReactNode;
}

export function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  loading = false, 
  disabled = false,
  style,
  icon,
}: ButtonProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const buttonStyle = [
    styles.button,
    variant === 'primary' && styles.primary,
    variant === 'outline' && styles.outline,
    variant === 'ghost' && styles.ghost,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    variant === 'primary' && styles.primaryText,
    variant === 'outline' && styles.outlineText,
    variant === 'ghost' && styles.ghostText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? theme.colors.text.inverse : theme.colors.primary.base} />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text style={textStyle}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    button: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.roundness ? theme.roundness / 1.5 : 8,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    primary: {
      backgroundColor: theme.colors.primary.base,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.primary.base,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    disabled: {
      opacity: 0.5,
    },
    text: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
    },
    primaryText: {
      color: theme.colors.text.inverse,
    },
    outlineText: {
      color: theme.colors.primary.base,
    },
    ghostText: {
      color: theme.colors.primary.base,
    },
  });


