import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView } from 'react-native';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { useAuth } from '@/utils/useAuth';
import { useToast } from '@/components/ToastContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { schoolService } from '@/api/schools';
import { useKeyboardAvoidance } from '@/hooks/useKeyboardAvoidance';

type GradeBand = {
  min: string;
  max: string;
  label: string;
};

const DEFAULT_GRADE_BANDS: GradeBand[] = [
  { min: '80', max: '100', label: 'A1' },
  { min: '70', max: '79', label: 'B2' },
  { min: '65', max: '69', label: 'B3' },
  { min: '60', max: '64', label: 'C4' },
  { min: '55', max: '59', label: 'C5' },
  { min: '50', max: '54', label: 'C6' },
  { min: '45', max: '49', label: 'D7' },
  { min: '40', max: '44', label: 'E8' },
  { min: '0', max: '39', label: 'F9' },
];

export default function AssessmentSettings() {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user } = useAuth();
  const { showToast } = useToast();
  const keyboardAvoidance = useKeyboardAvoidance();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [caMax, setCaMax] = useState<string>('40');
  const [examMax, setExamMax] = useState<string>('60');
  const [gradeBands, setGradeBands] = useState<GradeBand[]>(DEFAULT_GRADE_BANDS);

  useEffect(() => {
    if (user?.school_id) loadSettings();
  }, [user?.school_id]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await schoolService.getById(user!.school_id as string);
      if (error) throw error;
      if (data) {
        setCaMax((data as any).assessment_ca_max?.toString() || '40');
        setExamMax((data as any).assessment_exam_max?.toString() || '60');

        const rawConfig = (data as any).assessment_grade_config;
        if (Array.isArray(rawConfig) && rawConfig.length > 0) {
          setGradeBands(
            rawConfig.map((band: any) => ({
              min: band.min?.toString() ?? '',
              max: band.max?.toString() ?? '',
              label: band.label?.toString() ?? '',
            }))
          );
        } else {
          setGradeBands(DEFAULT_GRADE_BANDS);
        }
      }
    } catch (err: any) {
      console.error('[AssessmentSettings] load error', err);
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.school_id) return;
    const ca = Math.max(0, Math.min(1000, parseInt(caMax || '0', 10) || 0));
    const exam = Math.max(0, Math.min(1000, parseInt(examMax || '0', 10) || 0));

    // Normalise grade bands
    const normalisedBands = gradeBands
      .map((band) => ({
        min: Math.max(0, Math.min(100, parseFloat(band.min || '0') || 0)),
        max: Math.max(0, Math.min(100, parseFloat(band.max || '0') || 0)),
        label: band.label.trim(),
      }))
      .filter((band) => band.label && band.max >= band.min)
      .sort((a, b) => b.min - a.min);

    if (normalisedBands.length === 0) {
      showToast('Please configure at least one valid grade band', 'warning');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await schoolService.update(user.school_id, ({
        assessment_ca_max: ca,
        assessment_exam_max: exam,
        assessment_grade_config: normalisedBands,
      } as any));
      if (error) throw error;
      showToast('Assessment settings updated', 'success');
    } catch (err: any) {
      console.error('[AssessmentSettings] save error', err);
      showToast(err?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={keyboardAvoidance.behavior}
      keyboardVerticalOffset={keyboardAvoidance.keyboardVerticalOffset}
    >
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: keyboardAvoidance.contentPaddingBottom }]}>
        <Card style={styles.card}>
          <Text style={styles.title}>Assessment Score Settings</Text>

          <Input
            label="CA Maximum"
            value={caMax}
            onChangeText={setCaMax}
            keyboardType="numeric"
            style={styles.inputSpacing} 
          />

          <Input
            label="Exam Maximum"
            value={examMax}
            onChangeText={setExamMax}
            keyboardType="numeric"
            style={styles.inputSpacing}
          />

          <Text style={styles.helperText}>These maxima apply across the school for all assessments. Adjust according to your grading scheme.</Text>

          <View style={styles.gradeHeaderRow}>
            <Text style={styles.sectionTitle}>Letter Grade Configuration</Text>
            <Text style={styles.sectionSubtitle}>Set the score ranges and their corresponding letter grades.</Text>
          </View>

          {gradeBands.map((band, index) => (
            <View key={index} style={styles.gradeRow}>
              <View style={styles.gradeRangeGroup}>
                <Input
                  label={index === 0 ? 'Min %' : undefined}
                  value={band.min}
                  onChangeText={(value) => {
                    const next = [...gradeBands];
                    next[index] = { ...next[index], min: value };
                    setGradeBands(next);
                  }}
                  keyboardType="numeric"
                  style={styles.gradeInput}
                />
                <Input
                  label={index === 0 ? 'Max %' : undefined}
                  value={band.max}
                  onChangeText={(value) => {
                    const next = [...gradeBands];
                    next[index] = { ...next[index], max: value };
                    setGradeBands(next);
                  }}
                  keyboardType="numeric"
                  style={styles.gradeInput}
                />
              </View>
              <View style={styles.gradeLabelGroup}>
                <Input
                  label={index === 0 ? 'Letter' : undefined}
                  value={band.label}
                  onChangeText={(value) => {
                    const next = [...gradeBands];
                    next[index] = { ...next[index], label: value };
                    setGradeBands(next);
                  }}
                  placeholder="e.g. A1"
                  style={styles.gradeLabelInput}
                />
              </View>
            </View>
          ))}

          <Button
            title="Reset to Default Grades"
            variant="outline"
            onPress={() => setGradeBands(DEFAULT_GRADE_BANDS)}
            style={styles.resetButton}
          />

          <Button title="Save Settings" onPress={handleSave} loading={saving} style={styles.saveButton} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme> | any) => {
  const safeTheme = theme || {
    colors: {
      background: { primary: '#ffffff' },
      surface: { primary: '#ffffff' },
      text: { primary: '#000000', secondary: '#666666' },
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16 },
    typography: { 
      fontSizes: { xs: 12, sm: 14, base: 16, lg: 18, '2xl': 24, '3xl': 30 }, 
      fontWeights: { medium: '500', semibold: '600', bold: '700' } 
    },
  };

  return StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: safeTheme.colors.background.primary,
    },
    content: { 
      padding: safeTheme.spacing.lg,
      backgroundColor: safeTheme.colors.background.primary,
    },
    card: { padding: safeTheme.spacing.lg,
      backgroundColor: safeTheme.colors.surface.primary,
    },
    title: { 
      fontSize: safeTheme.typography.fontSizes.lg, 
      fontWeight: safeTheme.typography.fontWeights.bold, 
      color: safeTheme.colors.text.primary, 
      marginBottom: safeTheme.spacing.md,
    },
    inputSpacing: { 
      marginTop: safeTheme.spacing.md,
      backgroundColor: safeTheme.colors.background.primary,
      color: safeTheme.colors.text.primary,
    },
    label:{
      color: safeTheme.colors.text.label,
    },
    saveButton: { marginTop: safeTheme.spacing.md,      
    },
    helperText: { 
      marginTop: safeTheme.spacing.sm, 
      color: safeTheme.colors.text.secondary, 
      fontSize: safeTheme.typography.fontSizes.sm,
    },
    gradeHeaderRow: {
      marginTop: safeTheme.spacing.lg,
      marginBottom: safeTheme.spacing.sm,
    },
    sectionTitle: {
      fontSize: safeTheme.typography.fontSizes.base,
      fontWeight: safeTheme.typography.fontWeights.semibold,
      color: safeTheme.colors.text.primary,
      marginBottom: safeTheme.spacing.xs / 2,
    },
    sectionSubtitle: {
      fontSize: safeTheme.typography.fontSizes.xs,
      color: safeTheme.colors.text.secondary,
    },
    gradeRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    gradeRangeGroup: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      flex: 1.2,
    },
    gradeLabelGroup: {
      flex: 0.8,
      color: safeTheme.colors.text.primary,
    },
    gradeInput: {
      flex: 1,
      marginBottom: 0,
      backgroundColor: safeTheme.colors.background.primary,
      color: safeTheme.colors.text.primary,
    },
    gradeLabelInput: {
      marginBottom: 0,
      backgroundColor: safeTheme.colors.background.primary,
      color: safeTheme.colors.text.primary,
    },
    resetButton: {
      marginTop: theme.spacing.lg,
    },
  });
};