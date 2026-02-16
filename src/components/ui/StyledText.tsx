/**
 * Texto con variantes de tipografía Safe Harbor.
 * Uso: <StyledText variant="h2">Título</StyledText>
 */
import React from 'react';
import { Text, type TextProps, StyleSheet } from 'react-native';
import { SafeHarbor } from '@/constants/SafeHarbor';

export type StyledTextVariant = 'h2' | 'h3' | 'h4' | 'body' | 'caption';

interface StyledTextProps extends TextProps {
  variant?: StyledTextVariant;
  children?: React.ReactNode;
}

const variantStyles: Record<StyledTextVariant, { fontSize: number; fontWeight: '400' | '500' | '600' | '700'; color: string }> = {
  h2: { fontSize: 22, fontWeight: '700', color: SafeHarbor.colors.text },
  h3: { fontSize: 18, fontWeight: '700', color: SafeHarbor.colors.text },
  h4: { fontSize: 16, fontWeight: '600', color: SafeHarbor.colors.text },
  body: { fontSize: 15, fontWeight: '400', color: SafeHarbor.colors.text },
  caption: { fontSize: 12, fontWeight: '400', color: SafeHarbor.colors.textSecondary },
};

export function StyledText({ variant = 'body', style, children, ...props }: StyledTextProps) {
  const vStyle = variantStyles[variant];
  return (
    <Text style={[vStyle, style]} {...props}>
      {children}
    </Text>
  );
}
