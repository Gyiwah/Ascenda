import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/theme';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      navigateBasedOnRole();
    } else if (user) {
      navigateBasedOnRole();
    }
  }, [user, loading, segments]);

  const navigateBasedOnRole = () => {
    if (!user) return;

    switch (user.role) {
      case 'super_admin':
        router.replace('/(superadmin)/dashboard');
        break;
      case 'admin':
        router.replace('/(admin)/dashboard');
        break;
      case 'headmaster':
        router.replace('/(headmaster)/dashboard');
        break;
      case 'teacher':
        router.replace('/(teacher)/dashboard');
        break;
      case 'student':
        router.replace('/(auth)/login');
        break;
      default:
        router.replace('/(auth)/login');
    }
  };

  return (
    <View style={styles.container}>
      <Loader />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
});
