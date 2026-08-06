import type { ColorSchemeName } from 'react-native';

export type ColorTokens = {
  background: string;
  border: string;
  primary: string;
  primarySoft: string;
  status: string;
  statusSoft: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  warning: string;
};

const lightColors: ColorTokens = {
  background: '#F3F6FA',
  border: '#CFD9E7',
  primary: '#1D4ED8',
  primarySoft: '#E8F0FF',
  status: '#0F766E',
  statusSoft: '#E3F4F1',
  surface: '#FFFFFF',
  surfaceMuted: '#EAF0F7',
  text: '#10233F',
  textMuted: '#526176',
  warning: '#B45309',
};

const darkColors: ColorTokens = {
  background: '#08111F',
  border: '#29425E',
  primary: '#79A9FF',
  primarySoft: '#142B50',
  status: '#5EEAD4',
  statusSoft: '#0D3535',
  surface: '#111F33',
  surfaceMuted: '#172A42',
  text: '#F5F8FC',
  textMuted: '#AFC0D4',
  warning: '#FBBF24',
};

export const colors = {
  dark: darkColors,
  light: lightColors,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 12,
  md: 18,
  lg: 26,
  pill: 999,
};

export const typography = {
  body: 16,
  display: 38,
  label: 13,
  title: 20,
};

export function getColors(colorScheme: ColorSchemeName): ColorTokens {
  return colorScheme === 'dark' ? colors.dark : colors.light;
}
