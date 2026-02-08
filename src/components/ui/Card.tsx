import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { SafeHarbor } from '@/constants/SafeHarbor';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...props }: CardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SafeHarbor.colors.white,
    borderRadius: SafeHarbor.spacing.cardRadius,
    padding: 16,
    borderWidth: 0,
  },
});
