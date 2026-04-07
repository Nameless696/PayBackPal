import { useColorScheme } from 'nativewind';

/** Matches the CSS tokens in global.css */
export const PALETTE = {
  dark: {
    bg:          '#0F0F1A',
    card:        '#1A1A2E',
    surface:     '#2D2B45',
    text1:       '#F1F0FF',
    text2:       '#B8B5D1',
    muted:       '#6B6890',
    border:      'rgba(255,255,255,0.08)',
    borderSolid: '#2D2B45',
    inputBg:     '#1A1A2E',
    headerTitle: '#FFFFFF',
  },
  light: {
    bg:          '#F4F2FF',   // lavender tint
    card:        '#FFFFFF',
    surface:     '#EDE9FE',   // violet-100
    text1:       '#1A1033',   // deep purple
    text2:       '#4C3D8F',   // medium purple
    muted:       '#8B7EC8',   // muted purple
    border:      '#DDD8F5',   // purple-tinted border
    borderSolid: '#DDD8F5',
    inputBg:     '#FFFFFF',
    headerTitle: '#FFFFFF',   // header is always on gradient so stays white
  },
} as const;


export type ThemeColors = { [K in keyof typeof PALETTE.dark]: string };

/** Returns the correct color set based on the current color scheme */
export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return PALETTE[colorScheme === 'dark' ? 'dark' : 'light'];
}
