/**
 * Design System - Export principale
 * COPIATO DA SEMPLISWITCH - NON MODIFICARE SENZA SINCRONIZZARE
 */

export { colors, colorsDark, type ColorKey, type Colors } from './colors';
export {
  fontSizes,
  fontWeights,
  lineHeights,
  typography,
} from './typography';
export {
  spacing,
  borderRadius,
  componentSizes,
  shadows,
  zIndex,
} from './spacing';

// ============ THEME OBJECT ============
// Oggetto tema completo per uso facile
import { colors, colorsDark } from './colors';
import { fontSizes, fontWeights, lineHeights, typography } from './typography';
import { spacing, borderRadius, componentSizes, shadows, zIndex } from './spacing';

export const theme = {
  colors,
  colorsDark,
  fontSizes,
  fontWeights,
  lineHeights,
  typography,
  spacing,
  borderRadius,
  componentSizes,
  shadows,
  zIndex,
} as const;

export type Theme = typeof theme;
