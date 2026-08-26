import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboardScreen from '../screens/admin/DashboardScreen';
import AcademicSetupTabs from '../screens/admin/academic/AcademicSetupTabs';
import TeachersScreen from '../screens/admin/TeachersScreen';
import StudentsScreen from '../screens/admin/StudentsScreen';
import AddTeacherScreen from '../screens/admin/AddTeacherScreen';
import AddStudentScreen from '../screens/admin/AddStudentScreen';
import AddClassScreen from '../screens/admin/academic/AddClassScreen';
import AddSubjectScreen from '../screens/admin/academic/AddSubjectScreen';
import AssignTeacherScreen from '../screens/admin/academic/AssignTeacherScreen';
import StudentDetailsScreen from '../screens/admin/StudentDetailsScreen';
import SettingsScreen from '../screens/common/SettingsScreen';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { Home, BookOpen, UserCircle, Users, GraduationCap } from 'lucide-react-native';
import { TouchableOpacity, View } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AdminTabs() {
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
            case 'AcademicSetup':
              return <BookOpen color={color} size={size} />;
            case 'Teachers':
              return <Users color={color} size={size} />;
            case 'Students':
              return <GraduationCap color={color} size={size} />;
            default:
              return null;
          }
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen 
        name="AcademicSetup" 
        component={AcademicSetupTabs}
        options={{ title: 'Academic Setup' }}
      />
      <Tab.Screen 
        name="Teachers" 
        component={TeachersScreen}
        options={{ title: 'Teachers' }}
      />
      <Tab.Screen 
        name="Students" 
        component={StudentsScreen}
        options={{ title: 'Students' }}
      />
    </Tab.Navigator>
  );
}

export default function AdminNavigator() {
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
      <Stack.Screen name="AdminTabs" component={AdminTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="AddClass"
        component={AddClassScreen}
        options={{ title: 'Add Classroom', headerBackTitle: 'Back' }}
      />

      <Stack.Screen
        name="AddSubject"
        component={AddSubjectScreen}
        options={{ title: 'Add Subject', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="AssignTeacher"
        component={AssignTeacherScreen}
        options={{ title: 'Assign Teacher', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="AddTeacher"
        component={AddTeacherScreen}
        options={{ title: 'Add Teacher', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="AddStudent"
        component={AddStudentScreen}
        options={{ title: 'Add Student', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="StudentDetails"
        component={StudentDetailsScreen}
        options={{ title: 'Student Details', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings & Preferences', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  );
}


