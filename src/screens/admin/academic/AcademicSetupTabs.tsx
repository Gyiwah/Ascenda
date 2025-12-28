import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import ClassesScreen from './ClassesScreen';
import SubjectsScreen from './SubjectsScreen';
import TeacherAssignmentScreen from './TeacherAssignmentScreen';
import AssessmentSettings from './AssessmentSettings';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { BookOpen, Hash, UserCheck, Settings } from 'lucide-react-native';

type TabType = 'classes' | 'subjects' | 'assignments' | 'settings';

/**
 * AcademicSetupTabs - Tabbed interface for Classes, Subjects, Assignments, and Assessment Settings
 */
export default function AcademicSetupTabs() {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [activeTab, setActiveTab] = useState<TabType>('classes');

  const tabs = [
    { id: 'classes' as TabType, label: 'Classes', icon: BookOpen },
    { id: 'subjects' as TabType, label: 'Subjects', icon: Hash },
    { id: 'assignments' as TabType, label: 'Assignments', icon: UserCheck },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'classes':
        return <ClassesScreen />;
      case 'subjects':
        return <SubjectsScreen />;
      case 'assignments':
        return <TeacherAssignmentScreen />;
      case 'settings':
        return <AssessmentSettings />;
      default:
        return <ClassesScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isLeftColumn = index % 2 === 0;
          const isTopRow = index < 2;
          
          return (
            <Pressable
              key={tab.id}
              style={[
                styles.tab,
                isLeftColumn && styles.tabLeftColumn,
                isTopRow && styles.tabTopRow,
                isActive && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Icon
                size={16}
                color={isActive ? theme.colors.primary.base : theme.colors.text.secondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.content}>{renderContent()}</View>
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary, 
    },
    tabBar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: theme.colors.surface.primary,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tab: {
      width: '50%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      gap: theme.spacing.xs,
    },
    tabLeftColumn: {
      borderRightWidth: 1,
      borderRightColor: theme.colors.border,
    },
    tabTopRow: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tabActive: {
      backgroundColor: theme.colors.primary.base + '0A',
    },
    tabLabel: {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.colors.text.secondary,
    },
    tabLabelActive: {
      color: theme.colors.primary.base,
      fontWeight: theme.typography.fontWeights.semibold,
    },
    content: {
      flex: 1,
    },
  });

