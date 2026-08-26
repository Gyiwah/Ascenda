import React, { useMemo } from 'react';
import { Modal as RNModal, View, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme, hexToRgba } from '@/theme';


interface ModalProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}

export function Modal({ visible, onRequestClose, children, contentStyle }: ModalProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onRequestClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    </RNModal>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: hexToRgba(theme.colors.background?.dark ?? '#000000', 0.6),
      justifyContent: 'flex-end',
    },
    content: {
      backgroundColor: theme.colors.surface.primary,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: theme.spacing.xl,
      maxHeight: '80%',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  });

