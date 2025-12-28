import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { Appearance, PixelRatio } from 'react-native';
import { ThemeMode, ThemeType, lightTheme, darkTheme, baseTypography } from './@themeConfig';
import { useSettingsStore } from '@/store/settingsStore';

// Font size multipliers for scaling
const FONT_SIZE_MULTIPLIERS: Record<'small' | 'medium' | 'large', number> = {
  small: 0.9,
  medium: 1.0,
  large: 1.15,
};

type ThemeContextType = {
	theme: any;
 	mode: ThemeMode;
 	setMode: (mode: ThemeMode) => void;
 	toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
	theme: lightTheme,
	mode: 'light',
	 
	setMode: () => {},
	 
	toggleMode: () => {}
});

// Utility: scale font sizes by device pixel ratio and user preference
function scaleFonts(
	typography: ThemeType['typography'],
	fontSizeMultiplier: number = 1.0
): ThemeType['typography'] {
	// Ensure typography and fontSizes exist
	if (!typography || !typography.fontSizes) {
		return baseTypography;
	}

	// Device pixel ratio scaling (clamped)
	const deviceRatio = Math.min(Math.max(PixelRatio.get() / 3, 0.9), 1.2);
	// Combined multiplier: device ratio * user preference
	const combinedRatio = deviceRatio * fontSizeMultiplier;

	// Extra safety: never call Object.entries on an undefined/null value
	const fontSizesSource =
		typography && typeof typography === 'object' && typography.fontSizes
			? typography.fontSizes
			: baseTypography.fontSizes;

	const scaled = Object.fromEntries(
		Object.entries(fontSizesSource as Record<string, number>).map(([k, v]) => [
			k,
			Math.round((v as number) * combinedRatio)
		])
	) as ThemeType['typography']['fontSizes'];

	return {
		...typography,
		fontSizes: {
			...baseTypography.fontSizes,
			...scaled
		}
	};
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	// Get theme preference from Zustand store
	const storeTheme = useSettingsStore((state) => state.theme);
	const fontSize = useSettingsStore((state) => state.fontSize);
	
	// Get font size multiplier
	const fontSizeMultiplier = FONT_SIZE_MULTIPLIERS[fontSize] ?? 1.0;
	
	// Determine actual theme mode based on store preference
	const systemMode = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
	const getInitialMode = (): ThemeMode => {
		if (storeTheme === 'system') return systemMode;
		return storeTheme === 'dark' ? 'dark' : 'light';
	};
	const [mode, setMode] = useState<ThemeMode>(getInitialMode());

	// Update mode when store theme changes
	useEffect(() => {
		if (storeTheme === 'system') {
			setMode(systemMode);
		} else {
			setMode(storeTheme === 'dark' ? 'dark' : 'light');
		}
	}, [storeTheme, systemMode]);

	// Listen to system theme changes when using 'system' preference
	useEffect(() => {
		if (storeTheme !== 'system') return;
		
		const sub = Appearance.addChangeListener(({ colorScheme }) => {
			if (colorScheme) {
				setMode(colorScheme === 'dark' ? 'dark' : 'light');
			}
		});
		return () => {
			// Safely remove listener if present
			// @ts-ignore
			if (typeof sub?.remove === 'function') sub.remove();
		};
	}, [storeTheme]);

	// Update theme when mode or font size changes
	const theme: ThemeType = useMemo(() => {
		const base = mode === 'dark' ? darkTheme : lightTheme;
		return {
			...base,
			typography: scaleFonts(base.typography, fontSizeMultiplier)
		};
	}, [mode, fontSizeMultiplier]);

	const value = useMemo<ThemeContextType>(
		() => ({
			theme,
			mode,
			setMode: (newMode: ThemeMode) => {
				// Update Zustand store when mode changes
				useSettingsStore.getState().setTheme(newMode === 'dark' ? 'dark' : 'light');
				setMode(newMode);
			},
			toggleMode: () => {
				const newMode = mode === 'dark' ? 'light' : 'dark';
				useSettingsStore.getState().setTheme(newMode);
				setMode(newMode);
			}
		}),
		[theme, mode]
	);

	return (
		<ThemeContext.Provider value={value}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useThemeMode() {
	return useContext(ThemeContext);
}

export function useAppTheme(): any {
	return useContext(ThemeContext).theme;
}

