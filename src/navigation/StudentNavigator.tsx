import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StudentDashboardScreen from '../screens/student/DashboardScreen';
import SettingsScreen from '../screens/common/SettingsScreen';
import { useAppTheme } from '@/theme/@ThemeProvider';
import { Home, UserCircle } from 'lucide-react-native';
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
            default:
              return null;
          }
        }
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={StudentDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
    </Tab.Navigator>
  );
}

export default function StudentNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="StudentTabs" component={StudentTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings & Preferences', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  );
}

