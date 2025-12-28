import { create } from 'zustand';
 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

// Type definitions for settings
export type ThemeType = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';

// Font size multipliers for scaling
export const scaleFontSize: Record<FontSize, number> = {
  small: 0.9,
  medium: 1.0,
  large: 1.15,
};

export interface SettingsState {
  // Theme settings
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;

  // Font size settings
  fontSize: FontSize;
  setFontSize: (fontSize: FontSize) => void;

  // Notification settings
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;

  // Accessibility settings
  reduceMotion: boolean;
  setReduceMotion: (reduce: boolean) => void;

  // Load settings from AsyncStorage
  loadSettings: () => Promise<void>;

  // Reset settings to default
  resetSettings: () => void;
}

// Create the Zustand store with AsyncStorage persistence
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'system',
      fontSize: 'medium',
      notificationsEnabled: true,
      reduceMotion: false,

      // Actions
      setTheme: (theme: ThemeType) => {
        set({ theme });
        // Log theme change
        console.log(`[Settings] Theme changed to: ${theme}`);
      },

      setFontSize: (fontSize: FontSize) => {
        set({ fontSize });
        // Log font size change
        console.log(`[Settings] Font size changed to: ${fontSize} (multiplier: ${scaleFontSize[fontSize as keyof typeof scaleFontSize]})`);
      },

      setNotificationsEnabled: (enabled: boolean) => {
        set({ notificationsEnabled: enabled });
        console.log(`[Settings] Notifications ${enabled ? 'enabled' : 'disabled'}`);
      },

      setReduceMotion: (reduce: boolean) => {
        set({ reduceMotion: reduce });
        console.log(`[Settings] Reduce motion ${reduce ? 'enabled' : 'disabled'}`);
      },

      // Load persisted settings from AsyncStorage
      loadSettings: async () => {
        try {
          const stored = await AsyncStorage.getItem('app-settings');
          if (stored) {
            const parsed = JSON.parse(stored);
            set(parsed);
            console.log('[Settings] Settings loaded from AsyncStorage');
          }
        } catch (error) {
          console.error('[Settings] Error loading settings from AsyncStorage:', error);
        }
      },

      // Reset to defaults
      resetSettings: () => {
        set({
          theme: 'system',
          fontSize: 'medium',
          notificationsEnabled: true,
          reduceMotion: false,
        });
        console.log('[Settings] Settings reset to defaults');
      },
    }),
    {
      // Zustand persist middleware config
      name: 'app-settings', // AsyncStorage key
      storage: createJSONStorage(() => {
        // Custom storage adapter that handles errors gracefully
        return {
          getItem: async (name: string): Promise<string | null> => {
            try {
              return await AsyncStorage.getItem(name);
            } catch (error) {
              console.warn(`[Settings] Failed to read from storage: ${name}`, error);
              return null;
            }
          },
          setItem: async (name: string, value: string): Promise<void> => {
            try {
              await AsyncStorage.setItem(name, value);
            } catch (error) {
              // Silently handle storage errors (e.g., storage full, unavailable)
              // This prevents the warning from appearing in console
              console.debug(`[Settings] Failed to write to storage: ${name}`, error);
            }
          },
          removeItem: async (name: string): Promise<void> => {
            try {
              await AsyncStorage.removeItem(name);
            } catch (error) {
              console.warn(`[Settings] Failed to remove from storage: ${name}`, error);
            }
          },
        };
      }),
      partialize: (state) => ({
        theme: state.theme,
        fontSize: state.fontSize,
        notificationsEnabled: state.notificationsEnabled,
        reduceMotion: state.reduceMotion,
      }),
    }
  )
);

// Convenience hooks for accessing individual settings
export const useTheme = () => useSettingsStore((state) => state.theme);
export const useFontSize = () => useSettingsStore((state) => state.fontSize);
export const useNotificationsEnabled = () => useSettingsStore((state) => state.notificationsEnabled);
export const useReduceMotion = () => useSettingsStore((state) => state.reduceMotion);
