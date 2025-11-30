/**
 * Button Component
 * COPIATO DA SEMPLISWITCH - NON MODIFICARE SENZA SINCRONIZZARE
 *
 * Fonte: sempliswitch/client/components/ui/button.tsx
 *
 * Varianti: default, destructive, outline, secondary, ghost, link
 * Sizes: default, sm, lg, icon
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { colors } from '../../styles/colors';
import { borderRadius, componentSizes, spacing } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

// ============ TYPES ============
export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

// ============ COMPONENT ============
export function Button({
  variant = 'default',
  size = 'default',
  loading = false,
  disabled = false,
  children,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // Get styles based on variant and size
  const containerStyle: ViewStyle[] = [
    styles.base,
    variantStyles[variant].container,
    sizeStyles[size].container,
    ...(isDisabled ? [styles.disabled] : []),
    ...(style ? [style as ViewStyle] : []),
  ];

  const textStyle: TextStyle[] = [
    styles.text,
    variantStyles[variant].text,
    sizeStyles[size].text,
    ...(isDisabled ? [styles.disabledText] : []),
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles[variant].loaderColor}
        />
      ) : typeof children === 'string' ? (
        <Text style={textStyle}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

// ============ BASE STYLES ============
const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    borderRadius: borderRadius.DEFAULT,
  },
  text: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
});

// ============ VARIANT STYLES ============
const variantStyles: Record<
  ButtonVariant,
  { container: ViewStyle; text: TextStyle; loaderColor: string }
> = {
  default: {
    container: {
      backgroundColor: colors.primary,
    },
    text: {
      color: colors.primaryForeground,
    },
    loaderColor: colors.primaryForeground,
  },
  destructive: {
    container: {
      backgroundColor: colors.destructive,
    },
    text: {
      color: colors.destructiveForeground,
    },
    loaderColor: colors.destructiveForeground,
  },
  outline: {
    container: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.input,
    },
    text: {
      color: colors.foreground,
    },
    loaderColor: colors.foreground,
  },
  secondary: {
    container: {
      backgroundColor: colors.secondary,
    },
    text: {
      color: colors.secondaryForeground,
    },
    loaderColor: colors.secondaryForeground,
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
    },
    text: {
      color: colors.foreground,
    },
    loaderColor: colors.foreground,
  },
  link: {
    container: {
      backgroundColor: 'transparent',
    },
    text: {
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    loaderColor: colors.primary,
  },
};

// ============ SIZE STYLES ============
const sizeStyles: Record<
  ButtonSize,
  { container: ViewStyle; text: TextStyle }
> = {
  default: {
    container: {
      height: componentSizes.buttonDefault,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
    },
    text: {
      fontSize: fontSizes.sm,
    },
  },
  sm: {
    container: {
      height: componentSizes.buttonSm,
      paddingHorizontal: spacing[3],
      borderRadius: borderRadius.md,
    },
    text: {
      fontSize: fontSizes.sm,
    },
  },
  lg: {
    container: {
      height: componentSizes.buttonLg,
      paddingHorizontal: spacing[8],
      borderRadius: borderRadius.md,
    },
    text: {
      fontSize: fontSizes.base,
    },
  },
  icon: {
    container: {
      height: componentSizes.buttonIcon,
      width: componentSizes.buttonIcon,
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    text: {
      fontSize: fontSizes.sm,
    },
  },
};

export default Button;
