import React, { useMemo, useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, ChevronLeft, ChevronRight, X, Check } from 'lucide-react-native';
import { useAppTheme } from '@/theme/@ThemeProvider';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

type DatePickerProps = {
  label?: string;
  value?: string; // YYYY-MM-DD or custom string
  onValueChange: (dateString: string) => void;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
  style?: any;
  error?: string;
};

export function DatePicker({
  label,
  value = '',
  onValueChange,
  placeholder = 'YYYY-MM-DD (e.g. 2012-12-12)',
  minYear = 1990,
  maxYear = new Date().getFullYear(),
  style,
  error,
}: DatePickerProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'year' | 'month'>('calendar');

  // Initial state based on current value or fallback
  const initialDate = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return { year: y, month: m - 1, day: d };
    }
    return { year: 2012, month: 0, day: 1 };
  }, [value]);

  const [selectedYear, setSelectedYear] = useState(initialDate.year);
  const [selectedMonth, setSelectedMonth] = useState(initialDate.month);
  const [selectedDay, setSelectedDay] = useState(initialDate.day);

  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      setSelectedYear(y);
      setSelectedMonth(m - 1);
      setSelectedDay(d);
    }
  }, [value]);

  // Generate list of years (descending)
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      list.push(y);
    }
    return list;
  }, [minYear, maxYear]);

  // Days in selected month
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // First day of week for selected month (0 = Sun, 1 = Mon, etc.)
  const firstDayOfWeek = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 1).getDay();
  }, [selectedYear, selectedMonth]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      if (selectedYear > minYear) {
        setSelectedYear(selectedYear - 1);
        setSelectedMonth(11);
      }
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      if (selectedYear < maxYear) {
        setSelectedYear(selectedYear + 1);
        setSelectedMonth(0);
      }
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleConfirm = () => {
    const mm = String(selectedMonth + 1).padStart(2, '0');
    const dd = String(Math.min(selectedDay, daysInMonth)).padStart(2, '0');
    const formatted = `${selectedYear}-${mm}-${dd}`;
    onValueChange(formatted);
    setOpen(false);
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onValueChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.muted}
          keyboardType="numbers-and-punctuation"
          autoCorrect={false}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.calendarButton}
          onPress={() => {
            setViewMode('calendar');
            setOpen(true);
          }}
          activeOpacity={0.7}
        >
          <Calendar size={20} color={theme.colors.primary.base} />
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{label || 'Select Date'}</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedDay} {MONTHS[selectedMonth]} {selectedYear}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.iconButton}>
                <X size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Mode Switcher Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, viewMode === 'calendar' && styles.activeTab]}
                onPress={() => setViewMode('calendar')}
              >
                <Text style={[styles.tabText, viewMode === 'calendar' && styles.activeTabText]}>
                  Calendar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, viewMode === 'month' && styles.activeTab]}
                onPress={() => setViewMode('month')}
              >
                <Text style={[styles.tabText, viewMode === 'month' && styles.activeTabText]}>
                  {SHORT_MONTHS[selectedMonth]}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, viewMode === 'year' && styles.activeTab]}
                onPress={() => setViewMode('year')}
              >
                <Text style={[styles.tabText, viewMode === 'year' && styles.activeTabText]}>
                  {selectedYear}
                </Text>
              </TouchableOpacity>
            </View>

            {/* View Mode: CALENDAR */}
            {viewMode === 'calendar' && (
              <View style={styles.calendarContainer}>
                {/* Month Navigation */}
                <View style={styles.navRow}>
                  <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
                    <ChevronLeft size={20} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setViewMode('month')}
                    style={styles.monthYearHeader}
                  >
                    <Text style={styles.monthYearText}>
                      {MONTHS[selectedMonth]} {selectedYear}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
                    <ChevronRight size={20} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>

                {/* Day Labels */}
                <View style={styles.daysHeader}>
                  {DAYS_OF_WEEK.map((d) => (
                    <Text key={d} style={styles.dayLabel}>
                      {d}
                    </Text>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={styles.daysGrid}>
                  {/* Empty offset slots */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <View key={`empty-${i}`} style={styles.dayCell} />
                  ))}

                  {/* Day numbers */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const isSelected = selectedDay === dayNum;
                    return (
                      <TouchableOpacity
                        key={`day-${dayNum}`}
                        style={[styles.dayCell, isSelected && styles.selectedDayCell]}
                        onPress={() => setSelectedDay(dayNum)}
                      >
                        <Text style={[styles.dayCellText, isSelected && styles.selectedDayText]}>
                          {dayNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* View Mode: MONTH PICKER */}
            {viewMode === 'month' && (
              <View style={styles.gridContainer}>
                <Text style={styles.gridHeading}>Select Month</Text>
                <View style={styles.monthsGrid}>
                  {MONTHS.map((m, idx) => {
                    const isSelected = selectedMonth === idx;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.chip, isSelected && styles.selectedChip]}
                        onPress={() => {
                          setSelectedMonth(idx);
                          setViewMode('calendar');
                        }}
                      >
                        <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>
                          {m}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* View Mode: YEAR PICKER */}
            {viewMode === 'year' && (
              <View style={styles.gridContainer}>
                <Text style={styles.gridHeading}>Select Year</Text>
                <ScrollView style={styles.yearScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.yearsGrid}>
                    {years.map((y) => {
                      const isSelected = selectedYear === y;
                      return (
                        <TouchableOpacity
                          key={y}
                          style={[styles.yearChip, isSelected && styles.selectedChip]}
                          onPress={() => {
                            setSelectedYear(y);
                            setViewMode('calendar');
                          }}
                        >
                          <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>
                            {y}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Footer Action Buttons */}
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setOpen(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
              >
                <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.confirmButtonText}>Set Date</Text>
              </TouchableOpacity>
            </View>
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
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.colors.text.primary,
      marginBottom: 2,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface.primary,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.md,
      minHeight: 48,
    },
    inputError: {
      borderColor: theme.colors.error.base,
    },
    textInput: {
      flex: 1,
      fontSize: theme.typography.fontSizes.base,
      color: theme.colors.text.primary,
      paddingVertical: theme.spacing.sm + 2,
    },
    calendarButton: {
      padding: theme.spacing.xs,
      marginLeft: theme.spacing.xs,
      borderRadius: theme.radii.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.error.base,
      marginTop: 2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    modalContent: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.radii.xl,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 10,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalTitle: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
    },
    modalSubtitle: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.primary.base,
      fontWeight: theme.typography.fontWeights.semibold,
      marginTop: 2,
    },
    iconButton: {
      padding: theme.spacing.xs,
      borderRadius: theme.radii.full,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.radii.md,
      padding: 3,
      gap: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 6,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.sm,
    },
    activeTab: {
      backgroundColor: theme.colors.surface.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    tabText: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeights.medium,
    },
    activeTabText: {
      color: theme.colors.primary.base,
      fontWeight: theme.typography.fontWeights.bold,
    },
    calendarContainer: {
      gap: theme.spacing.sm,
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.xs,
    },
    navButton: {
      padding: theme.spacing.xs,
      borderRadius: theme.radii.sm,
    },
    monthYearHeader: {
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    monthYearText: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
    },
    daysHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    dayLabel: {
      width: 38,
      textAlign: 'center',
      fontSize: theme.typography.fontSizes.xs,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.muted,
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
    },
    dayCell: {
      width: '14.28%',
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.sm,
      marginVertical: 2,
    },
    selectedDayCell: {
      backgroundColor: theme.colors.primary.base,
      borderRadius: theme.radii.full,
    },
    dayCellText: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.primary,
      fontWeight: theme.typography.fontWeights.medium,
    },
    selectedDayText: {
      color: '#ffffff',
      fontWeight: theme.typography.fontWeights.bold,
    },
    gridContainer: {
      maxHeight: 240,
      gap: theme.spacing.sm,
    },
    gridHeading: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.secondary,
    },
    monthsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      justifyContent: 'space-between',
    },
    chip: {
      width: '31%',
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.background.primary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    yearScroll: {
      maxHeight: 200,
    },
    yearsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      justifyContent: 'space-between',
    },
    yearChip: {
      width: '23%',
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.background.primary,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginVertical: 2,
    },
    selectedChip: {
      backgroundColor: theme.colors.primary.base,
      borderColor: theme.colors.primary.base,
    },
    chipText: {
      fontSize: theme.typography.fontSizes.xs,
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.colors.text.primary,
    },
    selectedChipText: {
      color: '#ffffff',
      fontWeight: theme.typography.fontWeights.bold,
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
      paddingTop: theme.spacing.xs,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    cancelButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radii.md,
    },
    cancelButtonText: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeights.medium,
    },
    confirmButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary.base,
      paddingHorizontal: theme.spacing.md + 4,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radii.md,
    },
    confirmButtonText: {
      fontSize: theme.typography.fontSizes.sm,
      color: '#ffffff',
      fontWeight: theme.typography.fontWeights.bold,
    },
  });
