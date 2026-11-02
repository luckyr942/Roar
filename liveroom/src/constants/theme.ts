// All colours and fonts in one place (THEME and FONT).
// Why: change a colour here and the whole app updates.

export const THEME = {
  bg: '#0B0B0E',
  surface: '#15151A',
  surfaceCard: '#121218',
  raised: '#23232A',
  line: '#2A2A32',
  muted: '#A3A3AE',
  dim: '#8A8A96',
  text: '#F4F4F6',

  roar: '#FFE14D',
  drop: '#FF5A36',
  dropText: '#FF7A5C',
  dropTint: '#1A1211',
  dropLine: '#5A2A20',
  mint: '#7CF0C8',

  mi: '#3D8BFF',
  miText: '#7EB2FF',
  miBand: '#1E5FC6',
  miDeep: '#111A2A',
  csk: '#F9CD05',
};

export const FONT = {
  body: 'Barlow_400Regular',
  semi: 'Barlow_600SemiBold',
  bold: 'Barlow_700Bold',
  black: 'Barlow_800ExtraBold',
  numBold: 'BarlowCondensed_700Bold',
  num: 'BarlowCondensed_800ExtraBold',
};

export const Colors = {
  light: {
    text: THEME.text,
    background: THEME.bg,
    tint: THEME.roar,
    icon: THEME.muted,
    tabIconDefault: THEME.muted,
    tabIconSelected: THEME.roar,
  },
  dark: {
    text: THEME.text,
    background: THEME.bg,
    tint: THEME.roar,
    icon: THEME.muted,
    tabIconDefault: THEME.muted,
    tabIconSelected: THEME.roar,
  },
};

export type ThemeColor = 'text' | 'background' | 'tint' | 'icon' | 'tabIconDefault' | 'tabIconSelected';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Fonts = {
  sans: 'System',
  mono: 'Courier',
};

export const MaxContentWidth = 800;
export const BottomTabInset = 60;
