// All colours and fonts in one place (THEME and FONT).
// Why: change a colour here and the whole app updates.

export const THEME = {
  // Ground & surfaces: flat, no gradients
  bg: '#0B0B0E',          // Stadium night black
  surface: '#15151A',     // Cards
  surfaceCard: '#121218', // Photo frames, inputs
  raised: '#23232A',      // Neutral ball chips, row dividers
  line: '#2A2A32',        // Hairlines
  muted: '#A3A3AE',       // Secondary text (passes 4.5:1 on surface)
  dim: '#8A8A96',         // Tertiary text
  text: '#F4F4F6',        // Primary text

  // Meaning colours: used only where they mean something
  roar: '#FFE14D',        // ROAR actions, your selection
  drop: '#FF5A36',        // Wickets, live, tension armed
  dropText: '#FF7A5C',    // Orange text on dark (more readable than drop)
  dropTint: '#1A1211',    // Armed card ground
  dropLine: '#5A2A20',    // Armed card border
  mint: '#7CF0C8',        // Fours, saved

  // Teams
  mi: '#3D8BFF',          // Mumbai Indians blue
  miText: '#7EB2FF',      // MI blue text on dark
  miBand: '#1E5FC6',      // MI memory-card band
  miDeep: '#111A2A',      // MI tinted tile
  csk: '#F9CD05',         // Chennai Super Kings yellow
};

// Barlow Condensed for scores and headlines (broadcast feel), Barlow for everything else.
// With custom fonts each weight is its own family, so never combine these with fontWeight.
export const FONT = {
  body: 'Barlow_400Regular',
  semi: 'Barlow_600SemiBold',
  bold: 'Barlow_700Bold',
  black: 'Barlow_800ExtraBold',
  numBold: 'BarlowCondensed_700Bold',
  num: 'BarlowCondensed_800ExtraBold',
};

// Compatibility exports for Expo template starter components
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
