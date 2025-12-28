import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import RootNavigator from './src/navigation/RootNavigator';
import { ToastProvider } from './src/components/ToastContext';
import { ThemeProvider, useAppTheme, useThemeMode } from './src/theme/@ThemeProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { initOfflineDb } from './src/offline/sqlite';

SplashScreen.preventAutoHideAsync();

let fontSource = {};
try {
  fontSource = { 'Dustrone': require('./assets/fonts/Dustrone-Regular.ttf') };
} catch (e) {
  console.log('Font not found, using system font');
}

export default function App() {
  const [fontsLoaded] = useFonts(fontSource);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    initOfflineDb().catch((e) => {
      console.warn('SQLite init failed', e);
    });
  }, []);

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const theme = useAppTheme();
  const { mode } = useThemeMode();

  const statusBarStyle: 'light' | 'dark' = mode === 'dark' ? 'light' : 'dark';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <ToastProvider>
        <RootNavigator />
        <StatusBar style={statusBarStyle} />
      </ToastProvider>
    </SafeAreaView>
  );
}

