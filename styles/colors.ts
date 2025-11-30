/**
 * Design System - Colori
 * COPIATO DA SEMPLISWITCH - NON MODIFICARE SENZA SINCRONIZZARE
 *
 * Fonte: sempliswitch/client/global.css
 */

// Conversione HSL → HEX per React Native
// HSL values dal CSS di Sempliswitch convertiti in HEX

export const colors = {
  // ============ COLORI PRINCIPALI ============
  primary: '#1974D6', // hsl(213, 87%, 35%) - BLU PRIMARIO
  primaryForeground: '#FFFFFF', // hsl(0, 0%, 100%)

  secondary: '#EEF3FE', // hsl(214, 95%, 93%) - BLU MOLTO CHIARO
  secondaryForeground: '#142F5A', // hsl(213, 31%, 15%) - GRIGIO SCURO

  accent: '#F59A15', // hsl(37, 91%, 55%) - ARANCIONE/GIALLO
  accentForeground: '#142F5A', // hsl(213, 31%, 15%)

  // ============ COLORI NEUTRALI ============
  background: '#FFFFFF', // hsl(0, 0%, 100%)
  foreground: '#142F5A', // hsl(213, 31%, 15%) - TESTO PRINCIPALE

  card: '#FFFFFF', // hsl(0, 0%, 100%)
  cardForeground: '#142F5A', // hsl(213, 31%, 15%)

  popover: '#FFFFFF', // hsl(0, 0%, 100%)
  popoverForeground: '#142F5A', // hsl(213, 31%, 15%)

  // ============ COLORI STATO ============
  destructive: '#F5634B', // hsl(0, 84%, 60%) - ROSSO ERROR
  destructiveForeground: '#FFFFFF', // hsl(0, 0%, 100%)

  success: '#22C55E', // Verde success (aggiunto)
  successForeground: '#FFFFFF',

  warning: '#F59A15', // Uguale ad accent - Arancione warning
  warningForeground: '#142F5A',

  info: '#1974D6', // Uguale a primary - Blu info
  infoForeground: '#FFFFFF',

  // ============ COLORI MUTED ============
  muted: '#EEF3FE', // hsl(214, 95%, 93%)
  mutedForeground: '#7D8CA0', // hsl(215, 20%, 65%) - GRIGIO MEDIO

  // ============ COLORI BORDER/INPUT ============
  border: '#E8F0FA', // hsl(214, 32%, 91%) - GRIGIO MOLTO CHIARO
  input: '#E8F0FA', // hsl(214, 32%, 91%)
  ring: '#1974D6', // hsl(213, 87%, 35%) - BLU PRIMARIO (focus)

  // ============ COLORI SIDEBAR ============
  sidebarBackground: '#FAFAFA', // hsl(0, 0%, 98%)
  sidebarForeground: '#3E444C', // hsl(240, 5.3%, 26.1%)
  sidebarPrimary: '#17181C', // hsl(240, 5.9%, 10%)
  sidebarPrimaryForeground: '#FAFAFA', // hsl(0, 0%, 98%)
  sidebarAccent: '#F3F3F4', // hsl(240, 4.8%, 95.9%)
  sidebarAccentForeground: '#17181C', // hsl(240, 5.9%, 10%)
  sidebarBorder: '#E6E9EF', // hsl(220, 13%, 91%)
  sidebarRing: '#4B9BE0', // hsl(217.2, 91.2%, 59.8%)

  // ============ COLORI SPECIFICI APP ============
  // Badge stati contratto
  statoInserito: '#EEF3FE', // secondary
  statoInVerifica: '#FEF3C7', // giallo chiaro
  statoLavorazione: '#DBEAFE', // blu chiaro
  statoOkInserimento: '#D1FAE5', // verde chiaro
  statoAttivato: '#22C55E', // verde
  statoSospeso: '#FEF3C7', // giallo chiaro
  statoAnnullato: '#FEE2E2', // rosso chiaro
  statoStornato: '#F3F4F6', // grigio

  // Badge stati pagamento
  pagamentoNonPagato: '#FEE2E2', // rosso chiaro
  pagamentoProntoFattura: '#FEF3C7', // giallo chiaro
  pagamentoInviatoFatturare: '#DBEAFE', // blu chiaro
  pagamentoPagato: '#D1FAE5', // verde chiaro
  pagamentoStornato: '#F3F4F6', // grigio

  // Categorie offerte
  categoriaEnergia: '#FEF3C7', // giallo chiaro
  categoriaTelefonia: '#DBEAFE', // blu chiaro
  categoriaFotovoltaico: '#D1FAE5', // verde chiaro
  categoriaAltro: '#F3F4F6', // grigio

  // Additional common colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Category colors for Luce/Gas
  categoriaLuce: '#FEF3C7', // giallo chiaro (stesso di energia)
  categoriaGas: '#FEE2E2', // rosso chiaro
} as const;

// ============ DARK MODE ============
export const colorsDark = {
  primary: '#4B9BE0', // hsl(213, 87%, 55%)
  primaryForeground: '#FFFFFF',

  secondary: '#1C2736', // hsl(213, 31%, 12%)
  secondaryForeground: '#EEF3FE',

  accent: '#F5B84A', // hsl(37, 91%, 65%)
  accentForeground: '#142F5A',

  background: '#0F1419', // hsl(213, 31%, 8%)
  foreground: '#EEF3FE', // hsl(214, 95%, 93%)

  card: '#0F1419',
  cardForeground: '#EEF3FE',

  destructive: '#F5634B',
  destructiveForeground: '#FFFFFF',

  muted: '#1C2736',
  mutedForeground: '#7D8CA0',

  border: '#1C2736',
  input: '#1C2736',
  ring: '#4B9BE0',

  sidebarBackground: '#17181C',
  sidebarForeground: '#F3F3F4',
  sidebarPrimary: '#4B76E0',
  sidebarPrimaryForeground: '#FFFFFF',
} as const;

// Type helper
export type ColorKey = keyof typeof colors;
export type Colors = typeof colors;
