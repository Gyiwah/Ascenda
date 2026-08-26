import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useAppTheme } from '@/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const buttonVariantStyle: Record<string, ViewStyle> = {
    primary: styles.primaryButton,
    secondary: styles.secondaryButton,
    outline: styles.outlineButton,
    danger: styles.dangerButton,
  };

  const buttonSizeStyle: Record<string, ViewStyle> = {
    small: styles.smallButton,
    medium: styles.mediumButton,
    large: styles.largeButton,
  };

  const textVariantStyle: Record<string, TextStyle> = {
    primary: styles.primaryText,
    secondary: styles.secondaryText,
    outline: styles.outlineText,
    danger: styles.dangerText,
  };

  const textSizeStyle: Record<string, TextStyle> = {
    small: styles.smallText,
    medium: styles.mediumText,
    large: styles.largeText,
  };

  const buttonStyles = [
    styles.button,
    buttonVariantStyle[variant],
    buttonSizeStyle[size],
    disabled && styles.disabledButton,
    style,
  ];

  const textStyles = [
    styles.text,
    textVariantStyle[variant],
    textSizeStyle[size],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? theme.colors.primary.base : theme.colors.text.inverse}
        />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}


const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    button: {
      borderRadius: theme.roundness ? theme.roundness / 1.5 : 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary.base,
    },
    secondaryButton: {
      backgroundColor: theme.colors.surface.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    outlineButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.primary.base,
    },
    dangerButton: {
      backgroundColor: theme.colors.error.base,
    },
    disabledButton: {
      opacity: 0.5,
    },
    smallButton: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      minHeight: 32,
    },
    mediumButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      minHeight: 44,
    },
    largeButton: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      minHeight: 52,
    },
    text: {
      fontWeight: theme.typography.fontWeights.semibold,
    },
    primaryText: {
      color: theme.colors.text.inverse,
    },
    secondaryText: {
      color: theme.colors.text.primary,
    },
    outlineText: {
      color: theme.colors.primary.base,
    },
    dangerText: {
      color: theme.colors.text.inverse,
    },
    disabledText: {
      color: theme.colors.text.secondary,
    },
    smallText: {
      fontSize: theme.typography.fontSizes.sm,
    },
    mediumText: {
      fontSize: theme.typography.fontSizes.base,
    },
    largeText: {
      fontSize: theme.typography.fontSizes.lg,
    },
  });

