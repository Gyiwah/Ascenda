import React, { useEffect, useRef, useMemo } from 'react';
import { View } from 'react-native';
import { NavigationContainer, NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../utils/useAuth';
import { User, StudentUser } from '@/types/database';
import SplashScreen from '../screens/common/SplashScreen';
import AuthNavigator from './AuthNavigator';
import AdminNavigator from './AdminNavigator';
import TeacherNavigator from './TeacherNavigator';
import HeadmasterNavigator from './HeadmasterNavigator';
import SuperAdminNavigator from './SuperAdminNavigator';
import StudentNavigator from './StudentNavigator';
import { navigationRef } from './navigationService';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useAppTheme, useThemeMode } from '@/theme';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const theme = useAppTheme();
  const { mode } = useThemeMode();
  const previousUserRef = useRef<User | StudentUser | null>(null);
  const navRef = useRef<any>(null);
  const isNavigationReadyRef = useRef<boolean>(false);

  const navTheme = useMemo(() => ({
    dark: mode === 'dark',
    colors: {
      primary: theme.colors.primary.base,
      background: theme.colors.background.primary,
      card: theme.colors.surface.primary,
      text: theme.colors.text.primary,
      border: theme.colors.border,
      notification: theme.colors.primary.base,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' as const },
      medium: { fontFamily: 'System', fontWeight: '500' as const },
      bold: { fontFamily: 'System', fontWeight: '700' as const },
      heavy: { fontFamily: 'System', fontWeight: '900' as const },
    },
  }), [theme, mode]);

  const getRouteNameForUser = (userRole: string | undefined) => {
    switch (userRole) {
      case 'super_admin':
        return 'SuperAdmin';
      case 'admin':
        return 'Admin';
      case 'headmaster':
        return 'Headmaster';
      case 'teacher':
        return 'Teacher';
      case 'student':
        return 'Student';
      default:
        return 'Auth';
    }
  };

  const navigateToRoute = (routeName: string) => {
    if (navRef.current?.isReady() && isNavigationReadyRef.current) {
      navRef.current.reset({
        index: 0,
        routes: [{ name: routeName as never }],
      });
    }
  };

  useEffect(() => {
    if (!loading && isNavigationReadyRef.current) {
      const previousUser = previousUserRef.current;
      const currentUser = user;

      // Handle user login - navigate to appropriate screen based on role
      if (!previousUser && currentUser) {
        // Handle both User and StudentUser types
        const role = 'role' in currentUser ? currentUser.role : 'student';
        const routeName = getRouteNameForUser(role);
        navigateToRoute(routeName);
      } 
      // Handle user logout - navigate to auth screen
      else if (previousUser && !currentUser) {
        navigateToRoute('Auth');
      }

      previousUserRef.current = currentUser;
    }
  }, [user, loading]);

  if (loading) {
    return <SplashScreen />;
  }

  const initialRouteName = !user ? 'Auth' : 'Auth';

  const handleNavigationReady = () => {
    isNavigationReadyRef.current = true;
    // Navigate immediately if user is already logged in 
    if (user && !loading) {
      // Handle both User and StudentUser types
      const role = 'role' in user ? user.role : 'student';
      const routeName = getRouteNameForUser(role);
      navigateToRoute(routeName);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <OfflineBanner />
      <NavigationContainer
        theme={navTheme}
        ref={(ref) => {
          navRef.current = ref;
          navigationRef.current = ref as unknown as NavigationContainerRefWithCurrent<any>;
        }}
        onReady={handleNavigationReady}
      >
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={initialRouteName}
        >
          <Stack.Screen name="Auth" component={AuthNavigator} />
          <Stack.Screen name="SuperAdmin" component={SuperAdminNavigator} />
          <Stack.Screen name="Admin" component={AdminNavigator} />
          <Stack.Screen name="Headmaster" component={HeadmasterNavigator} />
          <Stack.Screen name="Teacher" component={TeacherNavigator} />
          <Stack.Screen name="Student" component={StudentNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}


