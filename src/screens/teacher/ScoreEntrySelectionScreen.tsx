import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/utils/useAuth';
import { getMyAssignments } from '@/api/teacher/assignments';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Picker } from '@/components/ui/Picker';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { useKeyboardAvoidance } from '@/hooks/useKeyboardAvoidance';
import { ClipboardList } from 'lucide-react-native';

interface GroupedAssignment {
  class: { id: string; name: string; level: number };
  subjects: Array<{
    subject: { id: string; name: string; code: string };
    assignment: any;
  }>;
}

export default function ScoreEntrySelectionScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const keyboardAvoidance = useKeyboardAvoidance();

  const [assignments, setAssignments] = useState<GroupedAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id && user?.school_id) {
        loadAssignments();
      }
    }, [user?.id, user?.school_id])
  );

  // Reset subject when class changes
  useEffect(() => {
    if (selectedClassId) {
      const selectedClass = assignments.find(a => a.class.id === selectedClassId);
      if (!selectedClass) {
        setSelectedSubjectId('');
      }
    }
  }, [selectedClassId, assignments]);

  const loadAssignments = async () => {
    if (!user?.id || !user?.school_id) return;

    setLoading(true);
    try {
      const { data, error } = await getMyAssignments(user.id, user.school_id);
      
      if (error) {
        console.error('[ScoreEntrySelectionScreen] Error from getMyAssignments:', error);
        throw error;
      }
      
      setAssignments(data || []);
    } catch (err: any) {
      console.error('[ScoreEntrySelectionScreen] Error loading assignments:', err);
      showToast(err?.message || 'Failed to load classes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedClassId || !selectedSubjectId) {
      showToast('Please select both class and subject', 'error');
      return;
    }

    const selectedClass = assignments.find(a => a.class.id === selectedClassId);
    const selectedSubject = selectedClass?.subjects.find(s => s.subject.id === selectedSubjectId);

    if (!selectedClass || !selectedSubject) {
      showToast('Invalid selection', 'error');
      return;
    }

    navigation.navigate('StudentScoreEntry', {
      classId: selectedClassId,
      subjectId: selectedSubjectId,
      className: selectedClass.class.name,
      subjectName: selectedSubject.subject.name,
    });
  };

  if (loading) return <Loader />;

  // Flatten assignments for class picker
  const classOptions = assignments.map(a => ({
    label: a.class.name,
    value: a.class.id,
  }));

  // Get subjects for selected class
  const selectedClass = assignments.find(a => a.class.id === selectedClassId);
  const subjectOptions = selectedClass
    ? selectedClass.subjects.map(s => ({
        label: `${s.subject.name} (${s.subject.code})`,
        value: s.subject.id,
      }))
    : [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={keyboardAvoidance.behavior}
      keyboardVerticalOffset={keyboardAvoidance.keyboardVerticalOffset}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: keyboardAvoidance.contentPaddingBottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <ClipboardList size={32} color={theme.colors.primary.base} />
          </View>
          <Text style={styles.title}>Enter Scores</Text>
          <Text style={styles.subtitle}>Select a class and subject to begin entering scores</Text>
        </View>

        <Card style={styles.card}>
          <Picker
            label="Class *"
            value={selectedClassId}
            onValueChange={(value) => {
              setSelectedClassId(value);
              setSelectedSubjectId(''); // Reset subject when class changes
            }}
            options={classOptions}
            placeholder="Select a class"
          />

          <Picker
            label="Subject *"
            value={selectedSubjectId}
            onValueChange={setSelectedSubjectId}
            options={subjectOptions}
            placeholder={selectedClassId ? 'Select a subject' : 'Select a class first'}
            disabled={!selectedClassId}
            style={styles.inputSpacing}
          />

          <Button
            title="Continue to Score Entry"
            onPress={handleContinue}
            disabled={!selectedClassId || !selectedSubjectId}
            style={styles.button}
          />
        </Card>

        {assignments.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No class assignments found</Text>
            <Text style={styles.emptySubtext}>
              Contact your administrator to get assigned to classes and subjects.
            </Text>
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    content: {
      padding: theme.spacing.lg,
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.primary.base + '1A',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    card: {
      padding: theme.spacing.lg,
    },
    inputSpacing: {
      marginTop: theme.spacing.md,
    },
    button: {
      marginTop: theme.spacing.lg,
    },
    emptyCard: {
      padding: theme.spacing.lg,
      alignItems: 'center',
      marginTop: theme.spacing.lg,
    },
    emptyText: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    emptySubtext: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
  });

