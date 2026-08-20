/**
 * ROVR Fitness OS Theme Tokens
 */

import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  appBg: '#25272A',
  appBgDark: '#111214',
  card: 'rgba(255, 255, 255, 0.07)',
  cardBorder: 'rgba(255, 255, 255, 0.06)',
  cardElevated: 'rgba(255, 255, 255, 0.10)',
  cardLight: 'rgba(255, 255, 255, 0.22)',
  cardLightBorder: 'rgba(255, 255, 255, 0.38)',
  text: '#F7F8F9',
  textDark: '#111214',
  textMuted: 'rgba(255, 255, 255, 0.38)',
  textMuted2: 'rgba(255, 255, 255, 0.22)',
  textOnboardingMuted: '#687078',
  textOnboardingTitle: '#242629',
  lime: '#9BEA20',
  limeGlow: 'rgba(155, 234, 32, 0.35)',
  limeBg: 'rgba(155, 234, 32, 0.12)',
  limeBorder: 'rgba(155, 234, 32, 0.35)',
  cyan: '#22D3EE',
  cyanGlow: 'rgba(34, 211, 238, 0.3)',
  cyanBg: 'rgba(34, 211, 238, 0.1)',
  gold: '#F59E0B',
  red: '#F87171',
  redBg: 'rgba(220, 38, 38, 0.1)',
  light: {
    text: '#242629',
    background: '#DDE2E7',
    backgroundElement: 'rgba(255, 255, 255, 0.22)',
    backgroundSelected: '#FFFFFF',
    textSecondary: '#687078',
  },
  dark: {
    text: '#F7F8F9',
    background: '#25272A',
    backgroundElement: 'rgba(255, 255, 255, 0.07)',
    backgroundSelected: 'rgba(255, 255, 255, 0.10)',
    textSecondary: 'rgba(255, 255, 255, 0.38)',
  },
  lightBgGradient: ['#DDE2E7', '#C9D0D7', '#AEB7C0'] as const,
  darkBgGradient: ['#25272A', '#1A1C1F', '#111214'] as const,
  authBgGradient: ['#1A1E2A', '#111214', '#1C1A10'] as const,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    rounded: 'System',
    mono: 'Courier',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

