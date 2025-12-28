import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';

import { useAppTheme } from '@/theme/@ThemeProvider';
import { hexToRgba, colors as rootColors } from '@/theme';

type PickerOption = {
  label: string;
  value: string;
  meta?: string;
};

type PickerProps = {
  label?: string;
  value?: string;
  onValueChange: (value: string) => void;
  options: PickerOption[];
  placeholder?: string;
  style?: any;
  disabled?: boolean;
};

export function Picker({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  style,
  disabled = false,
}: PickerProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  return (
  <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={[styles.control, disabled ? styles.controlDisabled : null]} onPress={() => !disabled && setOpen(true)}>
        <Text style={[styles.valueText, !selected && styles.placeholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown color={theme.colors.text.secondary} size={18} />
      </Pressable>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select an option'}</Text>
              <Pressable onPress={() => setOpen(false)}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>
            <ScrollView>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => {
                      onValueChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
                      >
                        {option.label}
                      </Text>
                      {option.meta ? <Text style={styles.optionMeta}>{option.meta}</Text> : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    wrapper: {
      gap: theme.spacing.xs,
    },
    label: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.label,
      fontWeight: theme.typography.fontWeights.medium,
    },
    control: {
      minHeight: 48,
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface.primary,
    },
    controlDisabled: {
      opacity: 0.5,
    },
    valueText: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.primary,
    },
    placeholder: {
      color: theme.colors.text.muted,
    },
    backdrop: {
      flex: 1,
      backgroundColor: hexToRgba(rootColors.background.dark ?? '#000000', 0.45),
      justifyContent: 'center',
      padding: theme.spacing.lg,
    },
    modal: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface.primary,
      maxHeight: '70%',
      paddingVertical: theme.spacing.sm,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
    },
    modalTitle: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
    },
    closeText: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.primary.base,
      fontWeight: theme.typography.fontWeights.medium,
    },
    option: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.divider,
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionSelected: {
      backgroundColor: theme.colors.accent.base + '1A',
    },
    optionLabel: {
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.primary,
    },
    optionLabelSelected: {
      fontWeight: theme.typography.fontWeights.semibold,
    },
    optionMeta: {
      marginTop: 4,
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.muted,
    },
  });

