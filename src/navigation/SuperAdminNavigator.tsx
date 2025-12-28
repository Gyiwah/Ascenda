import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/utils/useAuth';
import SuperAdminDashboardScreen from '../screens/superadmin/DashboardScreen';
import SchoolsScreen from '../screens/superadmin/SchoolsScreen';
import UsersScreen from '../screens/superadmin/UsersScreen';
import AuditLogsScreen from '../screens/superadmin/AuditLogsScreen';
import AddSchoolScreen from '../screens/superadmin/AddSchoolScreen';
import AddUserScreen from '../screens/superadmin/AddUserScreen';
import SchoolDetailsScreen from '../screens/superadmin/SchoolDetailsScreen';
import UserDetailsScreen from '../screens/superadmin/UserDetailsScreen';
import SettingsScreen from '../screens/common/SettingsScreen';
import { Home, Building2, Users, ListChecks, UserCircle } from 'lucide-react-native';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { TouchableOpacity, View } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function SuperAdminTabs() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
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
            case 'Schools':
              return <Building2 color={color} size={size} />;
            case 'Users':
              return <Users color={color} size={size} />;
            case 'AuditLogs':
              return <ListChecks color={color} size={size} />;
            default:
              return null;
          }
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={SuperAdminDashboardScreen} />
      {isSuperAdmin && <Tab.Screen name="Schools" component={SchoolsScreen} />}
      {isSuperAdmin && <Tab.Screen name="Users" component={UsersScreen} />}
      {isSuperAdmin && <Tab.Screen name="AuditLogs" component={AuditLogsScreen} />}
    </Tab.Navigator>
  );
}

export default function SuperAdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="SuperAdminTabs" component={SuperAdminTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="AddSchool"
        component={AddSchoolScreen}
        options={{ title: 'Add School', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="AddUser"
        component={AddUserScreen}
        options={{ title: 'Add User', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="SchoolDetails"
        component={SchoolDetailsScreen}
        options={{ title: 'School Details', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="UserDetails"
        component={UserDetailsScreen}
        options={{ title: 'User Details', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings & Preferences', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  );
}

