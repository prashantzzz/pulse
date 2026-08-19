/**
 * PULSE design system — dark premium athletic theme.
 * The accent family (accent/accentSoft/gradients) is user-selectable;
 * the rest of the palette is fixed.
 */
import { Platform, type TextStyle } from 'react-native';
import { useSyncExternalStore } from 'react';

export type AccentKey = 'lime' | 'lavender' | 'mint' | 'sky' | 'teal' | 'coral' | 'rose' | 'gold';

export interface AccentPalette {
  key: AccentKey;
  label: string;
  accent: string;
  accentDim: string;
  accentDeep: string;
  accentSoft: string;
  accentSoft2: string;
  /** gradient pair used by primary buttons / FAB */
  gradient: [string, string];
}

/** trendy dark-theme-friendly accents (lime is the PULSE default) */
export const ACCENTS: Record<AccentKey, AccentPalette> = {
  lime: {
    key: 'lime', label: 'Lime',
    accent: '#B8FF20', accentDim: '#8ED50E', accentDeep: '#5C8C08',
    accentSoft: 'rgba(184, 255, 32, 0.13)', accentSoft2: 'rgba(184, 255, 32, 0.22)',
    gradient: ['#C8FF3C', '#8ED50E'],
  },
  lavender: {
    key: 'lavender', label: 'Lavender',
    accent: '#C4B5FD', accentDim: '#A78BFA', accentDeep: '#7C3AED',
    accentSoft: 'rgba(167, 139, 250, 0.15)', accentSoft2: 'rgba(167, 139, 250, 0.26)',
    gradient: ['#DDD3FF', '#8B5CF6'],
  },
  mint: {
    key: 'mint', label: 'Mint',
    accent: '#34D399', accentDim: '#10B981', accentDeep: '#047857',
    accentSoft: 'rgba(52, 211, 153, 0.14)', accentSoft2: 'rgba(52, 211, 153, 0.24)',
    gradient: ['#6EE7B7', '#059669'],
  },
  sky: {
    key: 'sky', label: 'Sky',
    accent: '#38BDF8', accentDim: '#0EA5E9', accentDeep: '#0369A1',
    accentSoft: 'rgba(56, 189, 248, 0.14)', accentSoft2: 'rgba(56, 189, 248, 0.24)',
    gradient: ['#7DD3FC', '#0284C7'],
  },
  teal: {
    key: 'teal', label: 'Teal',
    accent: '#2FD8D0', accentDim: '#14B8B8', accentDeep: '#0F766E',
    accentSoft: 'rgba(47, 216, 208, 0.14)', accentSoft2: 'rgba(47, 216, 208, 0.24)',
    gradient: ['#4DE8E2', '#0E9E96'],
  },
  coral: {
    key: 'coral', label: 'Coral',
    accent: '#FF9F43', accentDim: '#F97316', accentDeep: '#C2410C',
    accentSoft: 'rgba(255, 159, 67, 0.15)', accentSoft2: 'rgba(255, 159, 67, 0.25)',
    gradient: ['#FFB36B', '#F97316'],
  },
  rose: {
    key: 'rose', label: 'Rose',
    accent: '#F472B6', accentDim: '#EC4899', accentDeep: '#BE185D',
    accentSoft: 'rgba(244, 114, 182, 0.14)', accentSoft2: 'rgba(244, 114, 182, 0.24)',
    gradient: ['#F9A8D4', '#DB2777'],
  },
  gold: {
    key: 'gold', label: 'Gold',
    accent: '#FFC53D', accentDim: '#F59E0B', accentDeep: '#B45309',
    accentSoft: 'rgba(255, 197, 61, 0.15)', accentSoft2: 'rgba(255, 197, 61, 0.25)',
    gradient: ['#FFD77A', '#F59E0B'],
  },
};

let currentAccent: AccentKey = 'mint';

// --- reactive accent subscription -------------------------------------------
// Components that read the (mutated) `colors` object need a re-render signal
// when the accent changes. `applyAccent` bumps a version and notifies every
// `useAccent()` subscriber so already-mounted screens update in real time
// (previously the theme only refreshed after a full app restart).
let accentVersion = 0;
const accentListeners = new Set<() => void>();

function notifyAccentChange(): void {
  accentVersion += 1;
  accentListeners.forEach((l) => l());
}

/**
 * Subscribe the calling component to accent changes — call it at the top of
 * any screen/component that renders theme colors so it re-renders (and reads
 * the fresh `colors.*` / `gradients.*` values) the moment the user picks a new
 * accent, without needing a navigation or app restart.
 */
export function useAccent(): AccentKey {
  useSyncExternalStore(
    (cb) => {
      accentListeners.add(cb);
      return () => {
        accentListeners.delete(cb);
      };
    },
    () => accentVersion,
    () => accentVersion,
  );
  return currentAccent;
}

/**
 * Swap the live accent family in place. Call before rendering so every
 * component — including those reading `colors.accent` during render — picks
 * up the new palette.
 */
export function applyAccent(key: AccentKey): void {
  const p = ACCENTS[key];
  if (!p) return;
  currentAccent = key;
  colors.accent = p.accent;
  colors.accentDim = p.accentDim;
  colors.accentDeep = p.accentDeep;
  colors.accentSoft = p.accentSoft;
  colors.accentSoft2 = p.accentSoft2;
  gradients.accent = [p.gradient[0], p.gradient[1]];
  gradients.accentVertical = [p.gradient[0], p.gradient[1]];
  gradients.hero = [accentTint(p.accent, 0.17), '#0A0B0D'];
  notifyAccentChange();
}

/**
 * A dark, near-black tint of a color — used as the base of subtle brand
 * gradients (streak banners, hero cards) so they follow the selected accent
 * instead of staying lime-green.
 */
export function accentTint(hex: string, amount = 0.16): string {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  const to2 = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${to2(r * amount)}${to2(g * amount)}${to2(b * amount)}`;
}

export const colors = {
  // Surfaces
  bg: '#0A0B0D',
  surface: '#111316',
  surface2: '#16191D',
  surface3: '#1C2026',
  surface4: '#232830',
  border: '#22272E',
  borderBright: '#2E3540',

  // Text
  text: '#F4F7FB',
  textDim: '#A7AEBA',
  textMuted: '#66707E',

  // Brand — default Mint (swappable via applyAccent)
  accent: '#34D399',
  accentDim: '#10B981',
  accentDeep: '#047857',
  accentSoft: 'rgba(52, 211, 153, 0.14)',
  accentSoft2: 'rgba(52, 211, 153, 0.24)',

  // Supporting
  emerald: '#2BD27E',
  teal: '#2FD8D0',
  cyan: '#38BDF8',
  orange: '#FF9F43',
  red: '#FF5B66',
  gold: '#FFC53D',
  purple: '#A78BFA',
  pink: '#F472B6',

  // Chart series
  chart: ['#B8FF20', '#2BD27E', '#2FD8D0', '#38BDF8', '#A78BFA', '#FF9F43', '#FF5B66', '#FFC53D'],

  // Soft translucent tints for status colors (mirror the accentSoft pattern)
  dangerSoft: 'rgba(255, 91, 102, 0.15)',
  dangerSoft2: 'rgba(255, 91, 102, 0.12)',
  goldSoft: 'rgba(255, 197, 61, 0.12)',
  tealSoft: 'rgba(47, 216, 208, 0.12)',
  cyanSoft: 'rgba(56, 189, 248, 0.12)',
  emeraldSoft: 'rgba(43, 210, 126, 0.12)',

  // Fitness zone colors (muscle heatmap)
  zoneWell: '#2BD27E',
  zoneMod: '#FFC53D',
  zoneLow: '#FF5B66',
  zoneNone: '#23282F',

  success: '#2BD27E',
  warning: '#FFC53D',
  danger: '#FF5B66',

  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.6)',
  glass: 'rgba(17, 19, 22, 0.82)',
  glassLight: 'rgba(28, 32, 38, 0.72)',
  white: '#FFFFFF',
  black: '#000000',
};

export type Color = keyof typeof colors;

/** Brand gradients (pairs used by LinearGradient) */
export const gradients = {
  accent: ['#6EE7B7', '#059669'] as [string, string],
  accentVertical: ['#34D399', '#047857'] as [string, string],
  emerald: ['#34E39A', '#0FA968'] as [string, string],
  teal: ['#35E4DC', '#0E9E96'] as [string, string],
  cyan: ['#4CC9F0', '#1877F2'] as [string, string],
  orange: ['#FFB36B', '#F97316'] as [string, string],
  red: ['#FF8A93', '#E11D48'] as [string, string],
  gold: ['#FFD77A', '#F59E0B'] as [string, string],
  purple: ['#C4B5FD', '#7C3AED'] as [string, string],
  surface: ['#1C2026', '#121417'] as [string, string],
  card: ['#1A1E24', '#121417'] as [string, string],
  hero: ['#0A291E', '#0A0B0D'] as [string, string], // mutated live by applyAccent
  charcoal: ['#23282F', '#111316'] as [string, string],
  silhouette: ['#2C323B', '#191D23'] as [string, string],
};

export type GradientKey = keyof typeof gradients;

/** Fonts — Space Grotesk for display, Inter for body */
export const fonts = {
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
  displaySemi: 'SpaceGrotesk_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

export const type: Record<string, TextStyle> = {
  /** App name / massive numbers */
  hero: { fontFamily: fonts.display, fontSize: 44, lineHeight: 50, letterSpacing: -1.5 },
  h1: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, letterSpacing: -0.8 },
  h2: { fontFamily: fonts.display, fontSize: 23, lineHeight: 29, letterSpacing: -0.4 },
  h3: { fontFamily: fonts.displaySemi, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 22 },
  bodySemi: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  smallMedium: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18 },
  smallSemi: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 16, letterSpacing: 0.6, textTransform: 'uppercase' },
  micro: { fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 14 },
  num: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
  numLg: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  numSm: { fontFamily: fonts.displaySemi, fontSize: 17, lineHeight: 21, letterSpacing: -0.2, fontVariant: ['tabular-nums'] },
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  pill: 999,
} as const;

export const shadows = {
  card: Platform.select({
    web: { boxShadow: '0 8px 24px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.4)' },
    default: { elevation: 4, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  }),
  float: Platform.select({
    // neutral base; accent ambience is added at render time (e.g. sheet/toast)
    web: { boxShadow: '0 12px 32px rgba(0,0,0,0.55), 0 0 24px rgba(255,255,255,0.04)' },
    default: { elevation: 8, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  }),
} as const;

export const layout = {
  screenPad: 20,
  maxWidth: 640,
} as const;
