import { Tabs } from 'expo-router';
import { colors } from '@/theme';
import { School, Users, FileText, Home, User } from 'lucide-react-native';

export default function SuperAdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.background.light,
          borderTopColor: colors.neutral[200],
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
