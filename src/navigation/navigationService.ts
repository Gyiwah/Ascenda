import { NavigationContainerRefWithCurrent } from '@react-navigation/native';

// Navigation ref that will be set by RootNavigator
export const navigationRef: { current: NavigationContainerRefWithCurrent<any> | null } = { current: null };

/**
 * Navigate to a specific route
 */
export function navigate(name: string, params?: any) {
  if (navigationRef.current?.isReady()) {
    navigationRef.current.navigate(name as any, params as any);
  }
}

/**
 * Reset navigation stack to a specific route
 */
export function resetToRoute(name: string) {
  if (navigationRef.current?.isReady()) {
    navigationRef.current.reset({
      index: 0,
      routes: [{ name: name as any }],
    });
  }
}

/**
 * Go back in navigation stack
 */
export function goBack() {
  if (navigationRef.current?.isReady() && navigationRef.current.canGoBack()) {
    navigationRef.current.goBack();
  }
}

