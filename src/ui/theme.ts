/**
 * MyHealth design tokens — Healthcare Design System (`libs/ui/src/styles/theme.css`)
 * converted to hex for React Native. Source of truth: design/README.md (ui/README.md).
 */
import { Platform, type TextStyle } from 'react-native';

export type Tone = { fg: string; bg: string };

export type Palette = {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  textMuted: string;
  textBody: string;
  border: string;
  inputBorder: string;
  inputReadOnlyBg: string;
  primary: string;
  onPrimary: string;
  primaryDeep: string;
  primarySubtle: string;
  link: string;
  success: Tone;
  warning: Tone;
  danger: Tone;
  info: Tone;
  /** Marker dot on the range bar when the value sits in the warning segment. */
  warningMarker: string;
  dangerDot: string;
  dangerBorder: string;
  disabled: Tone;
  switchTrackOff: string;
  segmentedBg: string;
  /** Next-visit hero card on Home. */
  hero: { bg: string; fg: string; fgMuted: string; dateBg: string; dateFg: string; noteBg: string; noteFg: string; pillBg: string; pillFg: string; secondaryBorder: string; primaryBg: string; primaryFg: string; border: string };
  quickTints: { teal: Tone; amber: Tone; blue: Tone; violet: Tone };
  tabBarBg: string;
  scanner: { bg: string; frame: string; accent: string; muted: string };
};

export const light: Palette = {
  background: '#F2F6F7',
  card: '#FFFFFF',
  cardBorder: 'rgba(20,37,47,0.05)',
  text: '#14252F',
  textMuted: '#4A5C66',
  textBody: '#2D3F49',
  border: '#E3EAEC',
  inputBorder: '#CBD8DC',
  inputReadOnlyBg: '#F2F6F7',
  primary: '#1E7A8C',
  onPrimary: '#FFFFFF',
  primaryDeep: '#1F4D5A',
  primarySubtle: '#E0F2F2',
  link: '#1E7A8C',
  success: { fg: '#1E6B3A', bg: '#DDF3E4' },
  warning: { fg: '#8A4B0B', bg: '#FDF1D8' },
  danger: { fg: '#B42318', bg: '#FCEBEA' },
  info: { fg: '#1F4E85', bg: '#EAF1FB' },
  warningMarker: '#D98A12',
  dangerDot: '#C8352B',
  dangerBorder: '#F0C9C5',
  disabled: { fg: '#6B7B83', bg: '#EEF2F3' },
  switchTrackOff: '#B8C6CB',
  segmentedBg: '#E3EAEC',
  hero: {
    bg: '#17697A',
    fg: '#FFFFFF',
    fgMuted: 'rgba(255,255,255,0.9)',
    dateBg: '#FFFFFF',
    dateFg: '#1F4D5A',
    noteBg: 'rgba(255,255,255,0.12)',
    noteFg: '#FFFFFF',
    pillBg: 'rgba(255,255,255,0.18)',
    pillFg: '#FFFFFF',
    secondaryBorder: 'rgba(255,255,255,0.5)',
    primaryBg: '#FFFFFF',
    primaryFg: '#1F4D5A',
    border: 'transparent',
  },
  quickTints: {
    teal: { bg: '#DDF1F1', fg: '#17697A' },
    amber: { bg: '#FCEFD3', fg: '#8A4B0B' },
    blue: { bg: '#E6EEFB', fg: '#1F4E85' },
    violet: { bg: '#EEE8FA', fg: '#5B3FA8' },
  },
  tabBarBg: 'rgba(255,255,255,0.94)',
  scanner: { bg: '#0B1418', frame: '#1A262B', accent: '#5DB3C4', muted: '#B9C8CD' },
};

export const dark: Palette = {
  background: '#0D1A1F',
  card: '#16252B',
  cardBorder: '#26363C',
  text: '#EDF3F4',
  textMuted: '#A9B8BD',
  textBody: '#CBD6DA',
  border: '#26363C',
  inputBorder: '#3A4E55',
  inputReadOnlyBg: '#121F24',
  primary: '#5DB3C4',
  onPrimary: '#0D1A1F',
  primaryDeep: '#CDEBEF',
  primarySubtle: '#183A42',
  link: '#8FD0DC',
  success: { fg: '#9EDDB0', bg: '#173524' },
  warning: { fg: '#F2D08A', bg: '#3A2E14' },
  danger: { fg: '#F3B3AA', bg: '#4A1F1B' },
  info: { fg: '#A9CDF5', bg: '#182C44' },
  warningMarker: '#F0B44C',
  dangerDot: '#F3B3AA',
  dangerBorder: '#6B2C26',
  disabled: { fg: '#7F9298', bg: '#121F24' },
  switchTrackOff: '#3A4E55',
  segmentedBg: '#121F24',
  hero: {
    bg: '#16252B',
    fg: '#EDF3F4',
    fgMuted: '#A9B8BD',
    dateBg: '#5DB3C4',
    dateFg: '#0D1A1F',
    noteBg: '#183A42',
    noteFg: '#CDEBEF',
    pillBg: '#182C44',
    pillFg: '#A9CDF5',
    secondaryBorder: '#3A4E55',
    primaryBg: '#5DB3C4',
    primaryFg: '#0D1A1F',
    border: '#26363C',
  },
  // Dark mode draws quick actions as bordered cards with a primary icon.
  quickTints: {
    teal: { bg: '#16252B', fg: '#5DB3C4' },
    amber: { bg: '#16252B', fg: '#5DB3C4' },
    blue: { bg: '#16252B', fg: '#5DB3C4' },
    violet: { bg: '#16252B', fg: '#5DB3C4' },
  },
  tabBarBg: 'rgba(22,37,43,0.94)',
  scanner: { bg: '#0B1418', frame: '#1A262B', accent: '#5DB3C4', muted: '#B9C8CD' },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  /** Side padding of every screen. */
  gutter: 20,
} as const;

export const radii = {
  input: 12,
  button: 14,
  buttonSm: 12,
  tile: 16,
  card: 22,
  cardLg: 26,
  hero: 28,
  sheet: 28,
  pill: 999,
} as const;

/** iOS/web use `boxShadow`; RN 0.76+ also renders it on Android (new architecture). */
export function elevation(scheme: 'light' | 'dark') {
  const isDark = scheme === 'dark';
  return {
    card: isDark ? undefined : '0 1px 2px rgba(20,37,47,0.04), 0 8px 24px rgba(20,37,47,0.06)',
    primary: isDark ? undefined : '0 6px 16px rgba(30,122,140,0.26)',
    hero: isDark ? undefined : '0 14px 32px rgba(23,105,122,0.32)',
    sheet: isDark ? '0 -8px 28px rgba(0,0,0,0.4)' : '0 -8px 28px rgba(20,37,47,0.08)',
    tabBar: isDark
      ? '0 12px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)'
      : '0 12px 32px rgba(20,37,47,0.14), 0 0 0 1px rgba(20,37,47,0.05)',
    segment: isDark ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 3px rgba(20,37,47,0.12)',
  };
}

export type Weight = 400 | 500 | 600 | 700 | 800;

export const fontFamily: Record<Weight, string> = {
  400: 'Figtree_400Regular',
  500: 'Figtree_500Medium',
  600: 'Figtree_600SemiBold',
  700: 'Figtree_700Bold',
  800: 'Figtree_800ExtraBold',
};

/**
 * Custom fonts on Android ignore `fontWeight`, so each weight is its own family.
 * On web the family names are registered the same way by expo-font.
 */
export function font(weight: Weight): TextStyle {
  return Platform.OS === 'android'
    ? { fontFamily: fontFamily[weight] }
    : { fontFamily: fontFamily[weight], fontWeight: String(weight) as TextStyle['fontWeight'] };
}

export const type = {
  /** Page title 30/800, −0.03em. */
  title: { fontSize: 30, lineHeight: 36, letterSpacing: -0.9, weight: 800 },
  /** Hero/sign-in heading. */
  display: { fontSize: 28, lineHeight: 32, letterSpacing: -0.56, weight: 800 },
  /** Header bar title on detail screens. */
  headerTitle: { fontSize: 18, lineHeight: 24, letterSpacing: 0, weight: 700 },
  section: { fontSize: 18, lineHeight: 24, letterSpacing: 0, weight: 700 },
  cardTitle: { fontSize: 16, lineHeight: 22, letterSpacing: 0, weight: 700 },
  body: { fontSize: 15, lineHeight: 22, letterSpacing: 0, weight: 400 },
  bodySm: { fontSize: 14, lineHeight: 20, letterSpacing: 0, weight: 400 },
  caption: { fontSize: 13, lineHeight: 18, letterSpacing: 0, weight: 400 },
  small: { fontSize: 12, lineHeight: 16, letterSpacing: 0, weight: 400 },
  eyebrow: { fontSize: 14, lineHeight: 20, letterSpacing: 0.28, weight: 700 },
} as const satisfies Record<string, { fontSize: number; lineHeight: number; letterSpacing: number; weight: Weight }>;

export type TypeVariant = keyof typeof type;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 };
export const MIN_TOUCH = 44;
export const BUTTON_HEIGHT = 52;
/** Room the floating tab bar takes at the bottom of tab screens. */
export const TAB_BAR_SPACE = 120;
