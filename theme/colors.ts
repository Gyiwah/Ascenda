export const colors = {
  // Brand Colors
  brand: {
    primaryPurple: '#3a2853',
    primaryOrange: '#e16510',
    lightNeutral: '#ebebe9',
    darkNeutral: '#6b403d',
  },
  
  // Primary (Core brand - Purple)
  primary: {
    50: '#f3f0f6',
    100: '#e6e1ed',
    200: '#cdc3db',
    300: '#b4a5c9',
    400: '#9b87b7',
    500: '#3a2853', // Main brand purple
    600: '#342145',
    700: '#2e1a37',
    800: '#281329',
    900: '#22101b',
  },
  
  // Secondary (Accent - Orange)
  secondary: {
    50: '#fef4ef',
    100: '#fce8de',
    200: '#f9d1bb',
    300: '#f6ba98',
    400: '#f3a375',
    500: '#e16510', // Main brand orange
    600: '#d95510',
    700: '#c1440d',
    800: '#a9360a',
    900: '#912807',
  },
  
  // Neutrals (Light & Dark Neutral)
  neutral: {
    50: '#fafaf9',
    100: '#f5f5f3',
    150: '#ebebe9', // Light neutral
    200: '#e0e0dd',
    300: '#d1d1ce',
    400: '#a8a8a3',
    500: '#8b8b86',
    600: '#6b403d', // Dark neutral
    700: '#5d3732',
    800: '#4f2f2a',
    900: '#412622',
  },
  
  // Semantic Colors
  success: {
    500: '#4caf50',
    600: '#43a047',
  },
  warning: {
    500: '#ff9800',
    600: '#fb8c00',
  },
  error: {
    500: '#f44336',
    600: '#e53935',
  },
  
  background: {
    light: '#ebebe9', // Brand light neutral
    dark: '#121212',
  },
  text: {
    primary: '#3a2853', // Brand purple
    secondary: '#6b403d', // Brand dark neutral
    disabled: '#a8a8a3',
    inverse: '#ffffff',
  },
};

export const darkTheme = {
  // Backgrounds
  background: "#22153eff",
  surface: "#33214a",
  card: "#2F2142",

  // Brand
  primary: "#e16510",
  secondary: "#ebebe9",
  accent: "#6b403d",

  // Text
  textPrimary: "#ebebe9",
  textSecondary: "#cfc6db",
  textMuted: "#9a8fb3",

  // UI Elements
  border: "#4b3568",
  divider: "#44305f",

  // Status
  success: "#6fcf97",
  warning: "#f2994a",
  error: "#eb5757",

  icon: "#ebebe9",
};

export const themes = {
  light: colors,
  dark: darkTheme,
};
