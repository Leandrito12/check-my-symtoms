/**
 * Tag/chip para etiquetas (ej. #Medicacion en historia clínica).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeHarbor } from '@/constants/SafeHarbor';

interface TagProps {
  label: string;
}

export function Tag({ label }: TagProps) {
  return (
    <View style={styles.tag}>
      <Text style={styles.text} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: SafeHarbor.colors.commentBg,
    marginRight: 6,
    marginBottom: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    color: SafeHarbor.colors.text,
  },
});
