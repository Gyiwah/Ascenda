import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Hash } from 'lucide-react-native';

import { useAuth } from '@/utils/useAuth';
import { subjectService } from '@/api/subjects';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ToastContext';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { useKeyboardAvoidance } from '@/hooks/useKeyboardAvoidance';
import { Subject } from '@/types/database';

/**
 * AddSubjectScreen - Add or edit a subject
 */
export default function AddSubjectScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { showToast } = useToast();
  const { user } = useAuth();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const keyboardAvoidance = useKeyboardAvoidance();

  const subjectId = route.params?.subjectId;
  const isEditing = !!subjectId;

  const [loading, setLoading] = useState(!!subjectId);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    if (subjectId) {
      loadSubject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  const loadSubject = async () => {
    setLoading(true);
    try {
      const { data, error } = await subjectService.getById(subjectId);
      if (error) throw error;
      if (data) {
        setName(data.name || '');
        setCode(data.code || '');
      }
    } catch (err: any) {
      console.error('[AddSubjectScreen] Error loading subject:', err);
      showToast('Failed to load subject', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.school_id) {
      showToast('School ID not found', 'error');
      return;
    }

    if (!name.trim()) {
      showToast('Please enter subject name', 'warning');
      return;
    }
    if (!code.trim()) {
      showToast('Please enter subject code', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Subject> = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        school_id: user.school_id,
      };

      if (isEditing) {
        const { error } = await subjectService.update(subjectId, payload);
        if (error) throw error;
        showToast('Subject updated', 'success');
      } else {
        const { error } = await subjectService.create(payload);
        if (error) throw error;
        showToast('Subject created', 'success');
      }

      navigation.goBack();
    } catch (err: any) {
      console.error('[AddSubjectScreen] Save error:', err);
      showToast(err?.message || 'Save failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={keyboardAvoidance.behavior}
      keyboardVerticalOffset={keyboardAvoidance.keyboardVerticalOffset}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardAvoidance.contentPaddingBottom }]}> 
        <View style={styles.header}>
          <Text style={styles.title}>{isEditing ? 'Edit Subject' : 'New Subject'}</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.iconContainer}>
            <Hash size={32} color={theme.colors.primary.base} />
          </View>

          <Input
            label="Subject Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g., Mathematics, English"
            style={styles.inputSpacing}
          />
          <Input
            label="Subject Code *"
            value={code}
            onChangeText={setCode}
            placeholder="e.g., MATH, ENG"
            autoCapitalize="characters"
            style={styles.inputSpacing}
          />

          <Button
            title={isEditing ? 'Update Subject' : 'Create Subject'}
            onPress={handleSave}
            loading={submitting}
            style={styles.saveButton}
          />
          <Button
            title="Add Class"
            variant="ghost"
            onPress={() => navigation.navigate('AddClass')}
            style={styles.linkButton}
          />
          <Button
            title="Assign Teacher"
            variant="ghost"
            onPress={() => navigation.navigate('AssignTeacher')}
            style={styles.linkButton}
          />
        </Card>
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
    scrollContent: {
      padding: theme.spacing.lg,
    },
    header: {
      marginBottom: theme.spacing.lg,
      backgroundColor: theme.colors.surface.primary,
    },
    title: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
    },
    card: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface.primary,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    inputSpacing: {
      marginTop: theme.spacing.md,
      backgroundColor: theme.colors.background.primary,
      color: theme.colors.text.primary,
    },
    saveButton: {
      marginTop: theme.spacing.xl,
    },
    linkButton: {
      marginTop: theme.spacing.sm,
    },
  });

