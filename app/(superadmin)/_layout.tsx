import { Tabs } from 'expo-router';
import { useAppTheme } from '@/theme';
import { School, Users, FileText, Home, User } from 'lucide-react-native';

export default function SuperAdminLayout() {
  const theme = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary.base,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface.primary,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schools"
        options={{
          title: 'Schools',
          tabBarIcon: ({ color, size }) => <School size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="audit-logs"
        options={{
          title: 'Audit Logs',
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="school-details"
        options={{
          href: null, // Hide from tabs
        }}
      />
    </Tabs>
  );
}

