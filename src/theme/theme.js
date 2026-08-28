export const COLORS = {
  // Primary Golf Palette
  bgDark: '#0B132B',       // Midnight Navy Deep Background
  bgCard: '#1C2541',       // Card Background
  bgSubtle: '#151E38',     // Secondary Surface
  border: '#2A365C',       // Subtle Border
  borderHighlight: '#10B981',

  // Golf Accent Colors
  primary: '#10B981',      // Fairway Emerald Green
  primaryDark: '#059669',  // Dark Green Accent
  primaryLight: '#34D399', // Mint Green Highlight
  accentGold: '#F59E0B',   // Trophy & Money Gold
  accentGoldBg: 'rgba(245, 158, 11, 0.15)',
  accentBlue: '#3B82F6',   // Las Vegas / Info Blue
  accentPurple: '#8B5CF6', // Skins / Special Mode
  accentOrange: '#F97316', // Bogeys & Warnings

  // Status & Scores
  eagleGold: '#FBBF24',    // Eagle/Albatross (-2 or better)
  birdieGreen: '#10B981',   // Birdie (-1)
  parSlate: '#94A3B8',     // Par (E)
  bogeyOrange: '#FB923C',  // Bogey (+1)
  doubleRed: '#EF4444',    // Double Bogey+ (+2+)

  // Dots / Trash Colors
  greenieColor: '#10B981',
  sandyColor: '#F59E0B',
  barkieColor: '#D97706',
  polieColor: '#8B5CF6',
  snakeColor: '#EF4444',
  camelColor: '#EA580C',
  waterColor: '#0EA5E9',

  // Text Colors
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0F172A',
  positiveMoney: '#34D399',
  negativeMoney: '#F87171',
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
