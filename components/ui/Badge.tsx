/**
 * Badge Component
 * COPIATO DA SEMPLISWITCH - NON MODIFICARE SENZA SINCRONIZZARE
 *
 * Fonte: sempliswitch/client/components/ui/badge.tsx
 *
 * Varianti: default, secondary, destructive, outline, success, warning
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { colors } from '../../styles/colors';
import { borderRadius, spacing } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

// ============ TYPES ============
export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

// ============ COMPONENT ============
export function Badge({
  variant = 'default',
  children,
  style,
  textStyle,
}: BadgeProps) {
  return (
    <View style={[styles.base, variantStyles[variant].container, style]}>
      {typeof children === 'string' ? (
        <Text style={[styles.text, variantStyles[variant].text, textStyle]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing['2.5'],
    paddingVertical: spacing['0.5'],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  text: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
});

// ============ VARIANT STYLES ============
const variantStyles: Record<
  BadgeVariant,
  { container: ViewStyle; text: TextStyle }
> = {
  default: {
    container: {
      backgroundColor: colors.primary,
      borderColor: 'transparent',
    },
    text: {
      color: colors.primaryForeground,
    },
  },
  secondary: {
    container: {
      backgroundColor: colors.secondary,
      borderColor: 'transparent',
    },
    text: {
      color: colors.secondaryForeground,
    },
  },
  destructive: {
    container: {
      backgroundColor: colors.destructive,
      borderColor: 'transparent',
    },
    text: {
      color: colors.destructiveForeground,
    },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
    },
    text: {
      color: colors.foreground,
    },
  },
  success: {
    container: {
      backgroundColor: colors.success,
      borderColor: 'transparent',
    },
    text: {
      color: colors.successForeground,
    },
  },
  warning: {
    container: {
      backgroundColor: colors.warning,
      borderColor: 'transparent',
    },
    text: {
      color: colors.warningForeground,
    },
  },
};

// ============ BADGE PER STATI CONTRATTO ============
export type StatoContrattoVariant =
  | 'inserito'
  | 'in_verifica'
  | 'lavorazione'
  | 'ok_inserimento'
  | 'attivato'
  | 'sospeso'
  | 'annullato'
  | 'stornato';

const statoContrattoColors: Record<
  StatoContrattoVariant,
  { bg: string; text: string }
> = {
  inserito: { bg: colors.statoInserito, text: colors.foreground },
  in_verifica: { bg: colors.statoInVerifica, text: '#92400E' },
  lavorazione: { bg: colors.statoLavorazione, text: '#1E40AF' },
  ok_inserimento: { bg: colors.statoOkInserimento, text: '#166534' },
  attivato: { bg: colors.statoAttivato, text: '#FFFFFF' },
  sospeso: { bg: colors.statoSospeso, text: '#92400E' },
  annullato: { bg: colors.statoAnnullato, text: '#991B1B' },
  stornato: { bg: colors.statoStornato, text: '#374151' },
};

export function StatoBadge({
  stato,
  style,
}: {
  stato: StatoContrattoVariant;
  style?: ViewStyle;
}) {
  const colorConfig = statoContrattoColors[stato] || statoContrattoColors.inserito;

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: colorConfig.bg },
        style,
      ]}
    >
      <Text style={[styles.text, { color: colorConfig.text }]}>
        {stato.replace('_', ' ').toUpperCase()}
      </Text>
    </View>
  );
}

export default Badge;
