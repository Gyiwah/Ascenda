export type ThemeMode = 'light' | 'dark';

export type ThemeType = {
	mode: ThemeMode;
	colors: {
		background: {
			primary: string;
			secondary: string;
			inverse: string;
			dark?: string;
		};
		surface: {
			primary: string;
			secondary: string;
		};
		text: {
			primary: string;
			secondary: string;
			inverse: string;
			muted: string;
			label: string;
		};
		primary: {
			base: string;
			light: string;
			dark: string;
		};
		accent: {
			base: string;
			light: string;
			dark: string;
		};
		warn: {
			base: string;
			light: string;
			dark: string;
		};
		error: {
			base: string;
			light: string;
			dark: string;
		};
		border: string;
		divider: string;
		// Allow additional semantic color groups (success, neutral, etc.) used across the app
		[key: string]: any;
	};
	typography: {
		fontSizes: {
			xs: number;
			sm: number;
			base: number;
			lg: number;
			xl: number;
			'2xl': number;
			'3xl': number;
			'4xl': number;
		};
		fontWeights: {
			regular: '400';
			medium: '500';
			semibold: '600';
			bold: '700';
		};
		lineHeights: {
			normal: number;
			relaxed: number;
			loose: number;
		};
	};
	roundness: number;
	spacing: {
		xs: number;
		sm: number;
		md: number;
		lg: number;
		xl: number;
		'2xl': number;
	};
};

// Base palette (provided): ebebe9, e16510, 3a2853, 6b403d
// Converting to usable hex: #ebebe9, #e16510, #3a2853, #6b403d
const palette = {
	neutral: '#ebebe9',
	primary: '#e16510',
	deepPurple: '#3a2853',
	earth: '#6b403d',
	black: '#000000',
	white: '#ffffff',
	red: '#e53935'
};

const lightColors = {
	// Light mode palette
	background: {
		primary: '#ebebe9',
		secondary: '#ffffff',
		inverse: '#1f1f1f',
		dark: '#121212',
	},
	surface: {
		// Flat cards
		primary: '#ffffff',
		secondary: '#f3f3f2'
	},
	text: {
		// Darker tones for contrast on light background
		primary: '#3a2853',
		secondary: '#6b403d',
		inverse: '#ffffff',
		muted: '#6b6b6b',
		label: '#e16510',
	},
	primary: { base: '#e16510', light: '#f08a45', dark: '#b74e0d' },
	accent:  { base: '#3a2853', light: '#513f6f', dark: '#2a1b3f' },
	warn:    { base: '#f59e0b', light: '#fbbf24', dark: '#b45309' },
	error:   { base: '#e53935', light: '#ef6c6a', dark: '#c62828' },
	success: { 500: '#10b981', 600: '#059669', base: '#10b981', light: '#34d399', dark: '#047857' },
	border:  '#e0dfdc',
	divider: '#e6e5e3'
};

const darkColors = {
	// Dark mode palette (no gradients) - darkened
	background: {
		primary: '#1A122A',
		secondary: '#33214a',
		inverse: '#ebebe9',
		dark: '#121212',
	},
	surface: {
		// Flat cards in same family tone for cohesive look
		primary: '#2F2142',
		secondary: '#33214a'
	},
	text: {
		// Light text for dark backgrounds
		primary: '#ebebe9',
		secondary: '#cfc6db',
		inverse: '#1A122A',
		muted: '#9a8fb3',
		label: '#1f2937'
	},
	primary: { base: '#e16510', light: '#f08a45', dark: '#b74e0d' },
	accent:  { base: '#6b403d', light: '#84544f', dark: '#4f2f2c' },
	warn:    { base: '#f2994a', light: '#fbbf24', dark: '#b45309' },
	error:   { base: '#eb5757', light: '#ef6c6a', dark: '#c62828' },
	success: { 500: '#10b981', 600: '#059669', base: '#10b981', light: '#34d399', dark: '#047857' },
	border:  '#4b3568',
	divider: '#44305f'
};

export const baseTypography = {
	fontSizes: {
		xs: 12,
		sm: 14,
		base: 16,
		lg: 18,
		xl: 20,
		'2xl': 24,
		'3xl': 30,
		'4xl': 36
	},
	fontWeights: {
		regular: '400',
		medium: '500',
		semibold: '600',
		bold: '700'
	} as const,
	lineHeights: {
		normal: 1.2,
		relaxed: 1.35,
		loose: 1.5
	}
};

export const lightTheme: ThemeType = {
	mode: 'light',
	colors: lightColors,
	typography: baseTypography,
	roundness: 12,
	spacing: {
		xs: 4,
		sm: 8,
		md: 12,
		lg: 16,
		xl: 24,
		'2xl': 32
	}
};

export const darkTheme: ThemeType = {
	mode: 'dark',
	colors: darkColors,
	typography: baseTypography,
	roundness: 12,
	spacing: {
		xs: 4,
		sm: 8,
		md: 12,
		lg: 16,
		xl: 24,
		'2xl': 32
	}
};
