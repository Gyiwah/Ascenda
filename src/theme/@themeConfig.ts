export type ThemeMode = 'light' | 'dark';

export type ThemeType = {
	mode: ThemeMode;
	colors: {
		background: {
			primary: string;
			secondary: string;
			inverse: string;
			dark: string;
			light: string;
			gray?: string;
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
			disabled?: string;
		};
		primary: {
			base: string;
			light: string;
			dark: string;
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
			[key: string | number]: any;
		};
		secondary: {
			base: string;
			light: string;
			dark: string;
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
			[key: string | number]: any;
		};
		accent: {
			base: string;
			light: string;
			dark: string;
			50?: string;
			100?: string;
			200?: string;
			300?: string;
			400?: string;
			500?: string;
			600?: string;
			700?: string;
			800?: string;
			900?: string;
			[key: string | number]: any;
		};
		neutral: {
			50: string;
			100: string;
			150?: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
			[key: string | number]: any;
		};
		warn: {
			base: string;
			light: string;
			dark: string;
			50?: string;
			100?: string;
			200?: string;
			300?: string;
			400?: string;
			500: string;
			600: string;
			700?: string;
			800?: string;
			900?: string;
			[key: string | number]: any;
		};
		error: {
			base: string;
			light: string;
			dark: string;
			50?: string;
			100?: string;
			200?: string;
			300?: string;
			400?: string;
			500: string;
			600: string;
			700?: string;
			800?: string;
			900?: string;
			[key: string | number]: any;
		};
		success: {
			base: string;
			light: string;
			dark: string;
			50?: string;
			100?: string;
			200?: string;
			300?: string;
			400?: string;
			500: string;
			600: string;
			700?: string;
			800?: string;
			900?: string;
			[key: string | number]: any;
		};
		border: string;
		divider: string;
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
	radii: {
		xs: number;
		sm: number;
		md: number;
		lg: number;
		xl: number;
		'2xl': number;
		full: number;
	};
	spacing: {
		xs: number;
		sm: number;
		md: number;
		lg: number;
		xl: number;
		'2xl': number;
	};
};


export const lightColors = {
	background: {
		primary: '#ebebe9',
		secondary: '#ffffff',
		inverse: '#1f1f1f',
		dark: '#121212',
		light: '#ebebe9',
		gray: '#f5f5f3',
	},
	surface: {
		primary: '#ffffff',
		secondary: '#f3f3f2',
	},
	text: {
		primary: '#3a2853',
		secondary: '#6b403d',
		inverse: '#ffffff',
		muted: '#8b8b86',
		label: '#e16510',
		disabled: '#a8a8a3',
	},
	primary: {
		base: '#e16510',
		light: '#f08a45',
		dark: '#b74e0d',
		50: '#fff3e9',
		100: '#ffe6d3',
		200: '#ffc6a3',
		300: '#ffa372',
		400: '#ff8647',
		500: '#e16510',
		600: '#c4580e',
		700: '#a84b0c',
		800: '#8b3e0a',
		900: '#6f3208',
	},
	secondary: {
		base: '#3a2853',
		light: '#513f6f',
		dark: '#2a1b3f',
		50: '#f3f0f6',
		100: '#e6e1ed',
		200: '#cdc3db',
		300: '#b4a5c9',
		400: '#9b87b7',
		500: '#3a2853',
		600: '#342145',
		700: '#2e1a37',
		800: '#281329',
		900: '#22101b',
	},
	accent: {
		base: '#6b403d',
		light: '#84544f',
		dark: '#4f2f2c',
		50: '#f5eeed',
		100: '#eadddc',
		200: '#d2b9b7',
		300: '#bb9693',
		400: '#a3726f',
		500: '#6b403d',
		600: '#5d3734',
		700: '#4f2f2c',
		800: '#412623',
		900: '#331e1b',
	},
	neutral: {
		50: '#fafaf9',
		100: '#f5f5f3',
		150: '#ebebe9',
		200: '#e0e0dd',
		300: '#d1d1ce',
		400: '#a8a8a3',
		500: '#8b8b86',
		600: '#6b403d',
		700: '#5d3732',
		800: '#4f2f2a',
		900: '#412622',
	},
	warn: {
		base: '#f59e0b',
		light: '#fbbf24',
		dark: '#b45309',
		50: '#fffbeb',
		100: '#fef3c7',
		200: '#fde68a',
		300: '#fcd34d',
		400: '#fbbf24',
		500: '#f59e0b',
		600: '#d97706',
		700: '#b45309',
		800: '#92400e',
		900: '#78350f',
	},
	error: {
		base: '#e53935',
		light: '#ef6c6a',
		dark: '#c62828',
		50: '#fef2f2',
		100: '#fee2e2',
		200: '#fecaca',
		300: '#fca5a5',
		400: '#f87171',
		500: '#e53935',
		600: '#c62828',
		700: '#b91c1c',
		800: '#991b1b',
		900: '#7f1d1d',
	},
	success: {
		base: '#10b981',
		light: '#34d399',
		dark: '#047857',
		50: '#f0fdf4',
		100: '#dcfce7',
		200: '#bbf7d0',
		300: '#86efac',
		400: '#4ade80',
		500: '#10b981',
		600: '#059669',
		700: '#047857',
		800: '#065f46',
		900: '#064e3b',
	},
	border: '#e0dfdc',
	divider: '#e6e5e3',
};

export const darkColors = {
	background: {
		primary: '#1A122A',
		secondary: '#281a40',
		inverse: '#ebebe9',
		dark: '#121212',
		light: '#1A122A',
		gray: '#22153e',
	},
	surface: {
		primary: '#2F2142',
		secondary: '#382650',
	},
	text: {
		primary: '#ebebe9',
		secondary: '#cfc6db',
		inverse: '#1A122A',
		muted: '#9a8fb3',
		label: '#f08a45',
		disabled: '#6e6383',
	},
	primary: {
		base: '#e16510',
		light: '#f08a45',
		dark: '#b74e0d',
		50: '#3a2010',
		100: '#4d2810',
		200: '#6a3612',
		300: '#914815',
		400: '#b75818',
		500: '#e16510',
		600: '#f08a45',
		700: '#f5a673',
		800: '#fac2a1',
		900: '#fde0cf',
	},
	secondary: {
		base: '#ebebe9',
		light: '#f5f5f4',
		dark: '#cfc6db',
		50: '#1f1530',
		100: '#281a40',
		200: '#352254',
		300: '#482f70',
		400: '#5e3e91',
		500: '#7a52b8',
		600: '#9b75d6',
		700: '#be9ef0',
		800: '#dbc8fa',
		900: '#f0e8fd',
	},
	accent: {
		base: '#cf837e',
		light: '#e29e9a',
		dark: '#6b403d',
		50: '#331e1b',
		100: '#412623',
		200: '#4f2f2c',
		300: '#5d3734',
		400: '#6b403d',
		500: '#cf837e',
		600: '#e29e9a',
		700: '#f0b9b6',
		800: '#f7d4d2',
		900: '#fdf0ef',
	},
	neutral: {
		50: '#22153e',
		100: '#2a1a4c',
		150: '#33214a',
		200: '#3d2858',
		300: '#4b3568',
		400: '#634b85',
		500: '#7e67a1',
		600: '#9a8fb3',
		700: '#cfc6db',
		800: '#ebebe9',
		900: '#ffffff',
	},
	warn: {
		base: '#f2994a',
		light: '#fbbf24',
		dark: '#b45309',
		50: '#3d2605',
		100: '#4d3007',
		200: '#6b430a',
		300: '#925b0d',
		400: '#b45309',
		500: '#f2994a',
		600: '#fbbf24',
		700: '#fcd34d',
		800: '#fde68a',
		900: '#fef3c7',
	},
	error: {
		base: '#eb5757',
		light: '#ef6c6a',
		dark: '#c62828',
		50: '#3b1212',
		100: '#4f1818',
		200: '#6e2121',
		300: '#942d2d',
		400: '#c62828',
		500: '#eb5757',
		600: '#ef6c6a',
		700: '#f87171',
		800: '#fca5a5',
		900: '#fecaca',
	},
	success: {
		base: '#10b981',
		light: '#34d399',
		dark: '#047857',
		50: '#072e21',
		100: '#0a3d2c',
		200: '#0f523c',
		300: '#166e51',
		400: '#047857',
		500: '#10b981',
		600: '#34d399',
		700: '#6ee7b7',
		800: '#a7f3d0',
		900: '#d1fae5',
	},
	border: '#4b3568',
	divider: '#44305f',
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
		'4xl': 36,
	},
	fontWeights: {
		regular: '400',
		medium: '500',
		semibold: '600',
		bold: '700',
	} as const,
	lineHeights: {
		normal: 1.2,
		relaxed: 1.35,
		loose: 1.5,
	},
};

export const baseRadii = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	'2xl': 32,
	full: 9999,
};

export const lightTheme: ThemeType = {
	mode: 'light',
	colors: lightColors,
	typography: baseTypography,
	roundness: 12,
	radii: baseRadii,
	spacing: {
		xs: 4,
		sm: 8,
		md: 12,
		lg: 16,
		xl: 24,
		'2xl': 32,
	},
};

export const darkTheme: ThemeType = {
	mode: 'dark',
	colors: darkColors,
	typography: baseTypography,
	roundness: 12,
	radii: baseRadii,
	spacing: {
		xs: 4,
		sm: 8,
		md: 12,
		lg: 16,
		xl: 24,
		'2xl': 32,
	},
};


