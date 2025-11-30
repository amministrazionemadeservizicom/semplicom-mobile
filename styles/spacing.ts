/**
 * Design System - Spacing e Layout
 * COPIATO DA SEMPLISWITCH - NON MODIFICARE SENZA SINCRONIZZARE
 *
 * Fonte: sempliswitch/client/global.css + Tailwind defaults
 */

// ============ SPACING SCALE ============
// Basato su Tailwind spacing scale (1 = 4px)
export const spacing: Record<string | number, number> = {
  0: 0,
  '0.5': 2,
  1: 4,
  '1.5': 6,
  2: 8,
  '2.5': 10,
  3: 12,
  '3.5': 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
};

// ============ BORDER RADIUS ============
// --radius: 0.5rem (8px) in Sempliswitch
export const borderRadius = {
  none: 0,
  sm: 4, // calc(var(--radius) - 4px)
  md: 6, // calc(var(--radius) - 2px)
  DEFAULT: 8, // var(--radius) = 0.5rem
  lg: 8, // var(--radius)
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999, // Per pulsanti pill/circular
} as const;

// ============ COMPONENT SIZES ============
// Dimensioni standard componenti (da Sempliswitch)
export const componentSizes = {
  // Button heights
  buttonSm: 36, // h-9 = 36px
  buttonDefault: 40, // h-10 = 40px
  buttonLg: 44, // h-11 = 44px
  buttonIcon: 40, // h-10 w-10 = 40px

  // Input heights
  inputDefault: 40, // h-10 = 40px
  inputLg: 48,

  // Touch targets (min 44px per accessibilità)
  minTouchTarget: 44,

  // Nav
  navBottomHeight: 64, // --nav-bottom-h: 64px
  headerHeight: 56,

  // Avatar
  avatarSm: 32,
  avatarDefault: 40,
  avatarLg: 48,

  // Icon
  iconSm: 16,
  iconDefault: 20,
  iconLg: 24,
} as const;

// ============ SHADOWS ============
// Shadow styles per React Native
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  DEFAULT: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

// ============ Z-INDEX ============
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
} as const;
