import { Tabs } from 'expo-router';
import { useAppTheme } from '@/theme';
import { Home, BookOpen, ClipboardList, MessageSquare, User } from 'lucide-react-native';

export default function TeacherLayout() {
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
        name="classes"
        options={{
          title: 'Classrooms',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="scores"
        options={{
          title: 'Scores',
          tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="remarks"
        options={{
          title: 'Remarks',
          tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
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

