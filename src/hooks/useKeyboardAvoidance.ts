import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Hook to get proper keyboard avoidance values
 * Uses safe area insets for better keyboard handling
 */
export function useKeyboardAvoidance() {
  const insets = useSafeAreaInsets();
  
  return {
    behavior: Platform.OS === 'ios' ? 'padding' as const : 'height' as const,
    keyboardVerticalOffset: Platform.OS === 'ios' 
      ? insets.top + 90  // iOS: header + safe area
      : 100,              // Android: fixed offset
    contentPaddingBottom: 250, // Extra padding for ScrollView content
  };
}

