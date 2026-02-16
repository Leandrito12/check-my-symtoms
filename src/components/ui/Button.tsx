import React from 'react';
import { Pressable, Text, StyleSheet, Platform, type PressableProps } from 'react-native';
import { SafeHarbor } from '@/constants/SafeHarbor';

const MIN_TAP = SafeHarbor.spacing.minTapTarget;

type Variant = 'primary' | 'secondary' | 'alert' | 'outline' | 'ghost';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: Variant;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, { bg: string; text: string; border?: boolean }> = {
  primary: { bg: SafeHarbor.colors.primary, text: SafeHarbor.colors.white },
  secondary: { bg: SafeHarbor.colors.secondary, text: SafeHarbor.colors.white },
  alert: { bg: SafeHarbor.colors.alert, text: SafeHarbor.colors.white },
  outline: { bg: 'transparent', text: SafeHarbor.colors.primary, border: true },
  ghost: { bg: 'transparent', text: SafeHarbor.colors.primary },
};

export function Button({
  title,
  variant = 'primary',
  fullWidth,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { bg, text, border } = variantStyles[variant];
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, minHeight: MIN_TAP, minWidth: MIN_TAP, opacity: disabled ? 0.6 : pressed ? 0.9 : 1 },
        fullWidth && styles.fullWidth,
        border && { borderWidth: 2, borderColor: SafeHarbor.colors.primary },
        Platform.OS === 'web' && !disabled && { cursor: 'pointer' },
        StyleSheet.flatten(style as object),
      ]}
      disabled={disabled}
      {...props}
    >
      <Text style={[styles.text, { color: text }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: SafeHarbor.spacing.cardRadius,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  fullWidth: { width: '100%' },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
