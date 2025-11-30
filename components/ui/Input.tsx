/**
 * Input Component
 * COPIATO DA SEMPLISWITCH - NON MODIFICARE SENZA SINCRONIZZARE
 *
 * Fonte: sempliswitch/client/components/ui/input.tsx
 */

import React, { forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors } from '../../styles/colors';
import { borderRadius, componentSizes, spacing } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

// ============ TYPES ============
export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
}

// ============ COMPONENT ============
export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      containerStyle,
      style,
      editable = true,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;
    const isDisabled = !editable;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}

        <TextInput
          ref={ref}
          style={[
            styles.input,
            hasError && styles.inputError,
            isDisabled && styles.inputDisabled,
            style,
          ]}
          placeholderTextColor={colors.mutedForeground}
          editable={editable}
          {...props}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}
        {helperText && !error && (
          <Text style={styles.helperText}>{helperText}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.foreground,
    marginBottom: spacing['1.5'],
  },
  input: {
    height: componentSizes.inputDefault,
    width: '100%',
    borderRadius: borderRadius.DEFAULT,
    borderWidth: 1,
    borderColor: colors.input,
    backgroundColor: colors.background,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  inputError: {
    borderColor: colors.destructive,
  },
  inputDisabled: {
    opacity: 0.5,
    backgroundColor: colors.muted,
  },
  errorText: {
    fontSize: fontSizes.xs,
    color: colors.destructive,
    marginTop: spacing[1],
  },
  helperText: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: spacing[1],
  },
});

export default Input;
