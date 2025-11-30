/**
 * Card Component
 * COPIATO DA SEMPLISWITCH - NON MODIFICARE SENZA SINCRONIZZARE
 *
 * Fonte: sempliswitch/client/components/ui/card.tsx
 */

import React from 'react';
import { View, Text, StyleSheet, ViewProps, TextProps } from 'react-native';
import { colors } from '../../styles/colors';
import { borderRadius, spacing, shadows } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

// ============ CARD ============
export interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...props }: CardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

// ============ CARD HEADER ============
export interface CardHeaderProps extends ViewProps {
  children: React.ReactNode;
}

export function CardHeader({ children, style, ...props }: CardHeaderProps) {
  return (
    <View style={[styles.cardHeader, style]} {...props}>
      {children}
    </View>
  );
}

// ============ CARD TITLE ============
export interface CardTitleProps extends TextProps {
  children: React.ReactNode;
}

export function CardTitle({ children, style, ...props }: CardTitleProps) {
  return (
    <Text style={[styles.cardTitle, style]} {...props}>
      {children}
    </Text>
  );
}

// ============ CARD DESCRIPTION ============
export interface CardDescriptionProps extends TextProps {
  children: React.ReactNode;
}

export function CardDescription({
  children,
  style,
  ...props
}: CardDescriptionProps) {
  return (
    <Text style={[styles.cardDescription, style]} {...props}>
      {children}
    </Text>
  );
}

// ============ CARD CONTENT ============
export interface CardContentProps extends ViewProps {
  children: React.ReactNode;
}

export function CardContent({ children, style, ...props }: CardContentProps) {
  return (
    <View style={[styles.cardContent, style]} {...props}>
      {children}
    </View>
  );
}

// ============ CARD FOOTER ============
export interface CardFooterProps extends ViewProps {
  children: React.ReactNode;
}

export function CardFooter({ children, style, ...props }: CardFooterProps) {
  return (
    <View style={[styles.cardFooter, style]} {...props}>
      {children}
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'column',
    padding: spacing[6],
    gap: spacing['1.5'],
  },
  cardTitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    color: colors.cardForeground,
    letterSpacing: -0.5,
  },
  cardDescription: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  cardContent: {
    padding: spacing[6],
    paddingTop: 0,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[6],
    paddingTop: 0,
  },
});

export default Card;
