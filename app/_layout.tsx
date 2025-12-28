import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ToastProvider } from '@/contexts/ToastContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Try to load Dustrone font, fallback gracefully if not found
let fontSource = {};
try {
  fontSource = { 'Dustrone': require('../assets/fonts/Dustrone-Regular.ttf') };
} catch (e) {
  // Font file not found, will use system font fallback
  console.log('Dustrone font not found, using system font');
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded] = useFonts(fontSource);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Don't block rendering if font isn't loaded yet
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ToastProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(superadmin)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(teacher)" />
        <Stack.Screen name="(headmaster)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ToastProvider>
  );
}
