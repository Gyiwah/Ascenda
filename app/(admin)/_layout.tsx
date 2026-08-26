import { Tabs } from 'expo-router';
import { useAppTheme } from '@/theme';
import { Home, Users, BookOpen, GraduationCap, Book, User } from 'lucide-react-native';

export default function AdminLayout() {
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
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Classrooms',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          tabBarIcon: ({ color, size }) => <GraduationCap size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="subjects"
        options={{
          title: 'Subjects',
          tabBarIcon: ({ color, size }) => <Book size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

