import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  User,
  Sun,
  Moon,
  Eye,
  Type,
  Bell,
  LogOut,
  ChevronRight,
  RotateCcw,
} from 'lucide-react-native';

import { useAuth } from '@/utils/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ToastContext';
import { useAppTheme, useThemeMode } from '@/theme/@ThemeProvider';
import { useKeyboardAvoidance } from '@/hooks/useKeyboardAvoidance';
import { supabase } from '@/database/client';
import {
  useSettingsStore,
  ThemeType,
  FontSize,
} from '@/store/settingsStore';

/**
 * Consolidated Settings & Profile Screen
 * Combines profile management, theme settings, font size preferences, and account actions
 */
export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const { mode } = useThemeMode();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const keyboardAvoidance = useKeyboardAvoidance();

  // Get settings from Zustand store
  const storeTheme = useSettingsStore((state) => state.theme);
  const fontSize = useSettingsStore((state) => state.fontSize);
  const notificationsEnabled = useSettingsStore(
    (state) => state.notificationsEnabled
  );
  const reduceMotion = useSettingsStore((state) => state.reduceMotion);

  // Store actions
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setFontSize = useSettingsStore((state) => state.setFontSize);
  const setNotificationsEnabled = useSettingsStore(
    (state) => state.setNotificationsEnabled
  );
  const setReduceMotion = useSettingsStore((state) => state.setReduceMotion);
  const resetSettings = useSettingsStore((state) => state.resetSettings);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Load settings on mount
  useEffect(() => {
    useSettingsStore.getState().loadSettings();
  }, []);

  /**
   * Handle password change
   * Validates inputs and updates password via Supabase
   */
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill all password fields', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'warning');
      return;
    }

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'warning');
      return;
    }

    setChangingPassword(true);
    try {
      // Update password via Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      showToast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('[Settings] Error changing password:', err);
      showToast(err?.message || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  /**
   * Handle logout
   * Signs out from Supabase and resets navigation
   */
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            // Sign out via auth hook (handles Supabase session and navigation)
            await signOut();
            showToast('Logged out successfully', 'success');
          } catch (error) {
            console.error('[Settings] Logout error:', error);
            showToast('Logout failed', 'error');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  /**
   * Handle reset settings
   * Resets all settings to defaults
   */
  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all settings to defaults. Continue?',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Reset',
          onPress: () => {
            resetSettings();
            showToast('Settings reset to defaults', 'success');
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Theme options
  const themeOptions: { label: string; value: ThemeType; icon: React.ReactNode }[] = [
    {
      label: 'Light',
      value: 'light',
      icon: <Sun size={18} color={theme.colors.primary.base} />,
    },
    {
      label: 'Dark',
      value: 'dark',
      icon: <Moon size={18} color={theme.colors.primary.base} />,
    },
    {
      label: 'System',
      value: 'system',
      icon: <Eye size={18} color={theme.colors.primary.base} />,
    },
  ];

  // Font size options
  const fontSizeOptions: { label: string; value: FontSize }[] = [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={keyboardAvoidance.behavior}
      keyboardVerticalOffset={keyboardAvoidance.keyboardVerticalOffset}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardAvoidance.contentPaddingBottom }]}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <User size={32} color={theme.colors.text.inverse} />
          </View>
          <Text style={styles.userName}>{(user as any)?.full_name || (user as any)?.email}</Text>
          <Text style={styles.userEmail}>{(user as any)?.email}</Text>
          {user?.role && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user.role.replace('_', ' ').toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Appearance Section */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          {/* Theme Selection */}
          <View style={styles.settingGroup}>
            <View style={styles.settingLabelRow}>
              <Moon size={20} color={theme.colors.text.secondary} />
              <Text style={styles.settingLabel}>Theme</Text>
            </View>
            <View style={styles.optionsGrid}>
              {themeOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.optionButton,
                    storeTheme === option.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setTheme(option.value)}
                >
                  {option.icon}
                  <Text
                    style={[
                      styles.optionText,
                      storeTheme === option.value && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Font Size Selection */}
          <View style={[styles.settingGroup, styles.settingGroupSpacing]}>
            <View style={styles.settingLabelRow}>
              <Type size={20} color={theme.colors.text.secondary} />
              <Text style={styles.settingLabel}>Font Size</Text>
            </View>
            <View style={styles.optionsRow}>
              {fontSizeOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.fontSizeButton,
                    fontSize === option.value && styles.fontSizeButtonActive,
                  ]}
                  onPress={() => setFontSize(option.value)}
                >
                  <Text
                    style={[
                      styles.fontSizeButtonText,
                      fontSize === option.value &&
                        styles.fontSizeButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Card>

        {/* Security Section */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Security</Text>

          {/* Change Password */}
          <View style={styles.passwordSection}>
            <Input
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              style={styles.inputSpacing}
            />
            <Input
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              style={styles.inputSpacing}
              placeholder="Minimum 8 characters"
            />
            <Input
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.inputSpacing}
            />
            <Button
              title="Change Password"
              onPress={handleChangePassword}
              loading={changingPassword}
              disabled={changingPassword}
              style={styles.passwordButton}
            />
          </View>
        </Card>

        {/* Accessibility Section */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Accessibility</Text>

          {/* Notifications Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelRow}>
              <Bell size={20} color={theme.colors.text.secondary} />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary.light,
              }}
              thumbColor={
                notificationsEnabled
                  ? theme.colors.primary.base
                  : theme.colors.text.secondary
              }
            />
          </View>

          {/* Reduce Motion Toggle */}
          <View style={[styles.toggleRow, styles.toggleRowSpacing]}>
            <View style={styles.toggleLabelRow}>
              <Type size={20} color={theme.colors.text.secondary} />
              <Text style={styles.settingLabel}>Reduce Motion</Text>
            </View>
            <Switch
              value={reduceMotion}
              onValueChange={setReduceMotion}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary.light,
              }}
              thumbColor={
                reduceMotion
                  ? theme.colors.primary.base
                  : theme.colors.text.secondary
              }
            />
          </View>
        </Card>

        {/* Actions Section */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Actions</Text>

          {/* Reset Settings Button */}
          <Pressable
            style={[styles.actionRow, styles.actionRowWarning]}
            onPress={handleResetSettings}
          >
            <RotateCcw size={18} color={theme.colors.warn.base} />
            <Text style={[styles.actionLabel, styles.actionLabelWarning]}>
              Reset All Settings
            </Text>
          </Pressable>

          {/* Logout Button */}
          <Pressable
            style={[
              styles.actionRow,
              styles.actionRowDanger,
              styles.actionRowSpacing,
            ]}
            onPress={handleLogout}
          >
            <LogOut size={18} color={theme.colors.error.base} />
            <Text style={[styles.actionLabel, styles.actionLabelDanger]}>
              Logout
            </Text>
          </Pressable>
        </Card>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>App Version 1.0.0</Text>
          <Text style={styles.footerText}>© 2025 Ascenda</Text>
        </View>
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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing['2xl'],
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary.base,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    userName: {
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    userEmail: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
    },
    roleBadge: {
      backgroundColor: theme.colors.primary.base + '20',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.roundness,
      marginTop: theme.spacing.xs,
    },
    roleText: {
      fontSize: theme.typography.fontSizes.xs,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.primary.base,
      textTransform: 'uppercase',
    },
    card: {
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    settingGroup: {
      marginBottom: theme.spacing.md,
    },
    settingGroupSpacing: {
      marginTop: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    settingLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    settingLabel: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.colors.text.primary,
    },
    optionsGrid: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      justifyContent: 'space-between',
    },
    optionButton: {
      flex: 1,
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background.primary,
    },
    optionButtonActive: {
      borderColor: theme.colors.primary.base,
      backgroundColor: theme.colors.primary.base + '10',
    },
    optionText: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs,
    },
    optionTextActive: {
      color: theme.colors.primary.base,
      fontWeight: theme.typography.fontWeights.semibold,
    },
    optionsRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      justifyContent: 'space-between',
    },
    fontSizeButton: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fontSizeButtonActive: {
      borderColor: theme.colors.primary.base,
      backgroundColor: theme.colors.primary.base + '10',
    },
    fontSizeButtonText: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeights.medium,
    },
    fontSizeButtonTextActive: {
      color: theme.colors.primary.base,
      fontWeight: theme.typography.fontWeights.semibold,
    },
    passwordSection: {
      marginTop: theme.spacing.sm,
    },
    inputSpacing: {
      marginTop: theme.spacing.md,
    },
    passwordButton: {
      marginTop: theme.spacing.md,
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
    },
    toggleRowSpacing: {
      paddingTop: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    toggleLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.roundness,
      marginBottom: theme.spacing.sm,
    },
    actionRowWarning: {
      backgroundColor: theme.colors.warn.base + '10',
    },
    actionRowDanger: {
      backgroundColor: theme.colors.error.base + '10',
    },
    actionRowSpacing: {
      marginBottom: 0,
    },
    actionLabel: {
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.medium,
    },
    actionLabelWarning: {
      color: theme.colors.warn.base,
    },
    actionLabelDanger: {
      color: theme.colors.error.base,
    },
    footer: {
      alignItems: 'center',
      marginTop: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    footerText: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text.secondary,
      marginVertical: theme.spacing.xs / 2,
    },
  });
