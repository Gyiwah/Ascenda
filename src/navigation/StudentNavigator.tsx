import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StudentDashboardScreen from '../screens/student/DashboardScreen';
import StudentSubjectsScreen from '../screens/student/StudentSubjectsScreen';
import StudentReportCardsScreen from '../screens/student/StudentReportCardsScreen';
import SettingsScreen from '../screens/common/SettingsScreen';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { Home, BookOpen, FileText, UserCircle } from 'lucide-react-native';
import { TouchableOpacity, View } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function StudentTabs() {
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
            case 'StudentSubjects':
              return <BookOpen color={color} size={size} />;
            case 'StudentReportCards':
              return <FileText color={color} size={size} />;
            default:
              return null;
          }
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={StudentDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="StudentSubjects" 
        component={StudentSubjectsScreen}
        options={{ title: 'Subjects & Scores' }}
      />
      <Tab.Screen 
        name="StudentReportCards" 
        component={StudentReportCardsScreen}
        options={{ title: 'Report Cards' }}
      />
    </Tab.Navigator>
  );
}

export default function StudentNavigator() {
  const theme = useAppTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.surface.primary },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: { color: theme.colors.text.primary },
      }}
    >
      <Stack.Screen name="StudentTabs" component={StudentTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="StudentSubjects"
        component={StudentSubjectsScreen}
        options={{ title: 'Subjects & Continuous Assessment', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="StudentReportCards"
        component={StudentReportCardsScreen}
        options={{ title: 'Terminal Report Cards', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings & Preferences', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  );
}



