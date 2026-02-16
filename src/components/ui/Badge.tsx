/**
 * Badge para tipo de registro (evolucion, estudio, etc.) o estado.
 * Color por tipo según Safe Harbor.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeHarbor } from '@/constants/SafeHarbor';

type BadgeColor = keyof typeof SafeHarbor.colors | string;

interface BadgeProps {
  label: string;
  color?: BadgeColor;
}

function getColor(color?: BadgeColor): string {
  if (!color) return SafeHarbor.colors.primary;
  return (SafeHarbor.colors as Record<string, string>)[color] ?? color;
}

export function Badge({ label, color }: BadgeProps) {
  const bg = getColor(color);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.text} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: SafeHarbor.colors.white,
  },
});
