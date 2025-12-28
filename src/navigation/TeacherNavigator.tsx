import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TeacherDashboardScreen from '../screens/teacher/DashboardScreen';
import MyClassesScreen from '../screens/teacher/MyClassesScreen';
import ScoreEntrySelectionScreen from '../screens/teacher/ScoreEntrySelectionScreen';
import StudentScoreEntryScreen from '../screens/teacher/StudentScoreEntryScreen';
import RemarkEntryScreen from '../screens/teacher/RemarkEntryScreen';
import SettingsScreen from '../screens/common/SettingsScreen';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { Home, BookOpen, ClipboardList, UserCircle } from 'lucide-react-native';
import { TouchableOpacity, View } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TeacherTabs() {
  const theme = useAppTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.surface.primary },
        headerTintColor: theme.colors.text.primary,
        headerRight: () => (
          <View style={{ paddingRight: 12 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <UserCircle color={theme.colors.text.primary} size={24} />
            </TouchableOpacity>
          </View>
        ),
        tabBarActiveTintColor: theme.colors.primary.base,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: { backgroundColor: theme.colors.surface.primary },
        tabBarIcon: ({ color, size }) => {
          switch (route.name) {
            case 'Dashboard':
              return <Home color={color} size={size} />;
            case 'MyClasses':
              return <BookOpen color={color} size={size} />;
            case 'ScoreEntry':
              return <ClipboardList color={color} size={size} />;
            default:
              return null;
          }
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={TeacherDashboardScreen} />
      <Tab.Screen 
        name="MyClasses" 
        component={MyClassesScreen}
        options={{ title: 'My Classes' }}
      />
      <Tab.Screen 
        name="ScoreEntry" 
        component={ScoreEntrySelectionScreen}
        options={{ title: 'Enter Scores' }}
      />
    </Tab.Navigator>
  );
}

export default function TeacherNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="TeacherTabs" component={TeacherTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="StudentScoreEntry"
        component={StudentScoreEntryScreen}
        options={{ title: 'Enter Scores', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="RemarkEntry"
        component={RemarkEntryScreen}
        options={{ title: 'Enter Remarks', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings & Preferences', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  );
}

