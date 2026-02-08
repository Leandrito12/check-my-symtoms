import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeHarbor } from '@/constants/SafeHarbor';
import type { PainLevel } from '@/src/domain/types';

const MIN_TAP = SafeHarbor.spacing.minTapTarget;
const LEVELS: PainLevel[] = [0, 1, 2, 3, 4, 5, 6, 7];

function getColor(level: number): string {
  if (level <= 3) return SafeHarbor.painLevelColors.calm;
  if (level <= 5) return SafeHarbor.painLevelColors.attention;
  return SafeHarbor.painLevelColors.alert;
}

function getFace(level: number): string {
  if (level <= 2) return '😊';
  if (level <= 5) return '😐';
  return '😣';
}

interface PainSliderProps {
  value: PainLevel;
  onChange: (value: PainLevel) => void;
  label?: string;
}

export function PainSlider({ value, onChange, label = 'Nivel de Dolor (0-7)' }: PainSliderProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.sliderRow}>
        {LEVELS.map((level) => {
          const isSelected = value === level;
          const color = getColor(level);
          return (
            <Pressable
              key={level}
              style={[
                styles.thumb,
                { backgroundColor: color, minWidth: MIN_TAP, minHeight: MIN_TAP },
                isSelected && styles.thumbSelected,
              ]}
              onPress={() => onChange(level)}
            >
              <Text style={styles.face}>{getFace(level)}</Text>
              <Text style={styles.number}>{level}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.valueDisplay}>
        <View style={[styles.valueBadge, { backgroundColor: getColor(value) }]}>
          <Text style={styles.valueText}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: SafeHarbor.colors.text,
    marginBottom: 8,
  },
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  thumb: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  thumbSelected: {
    borderWidth: 3,
    borderColor: SafeHarbor.colors.text,
  },
  face: { fontSize: 14 },
  number: {
    fontSize: 12,
    fontWeight: '700',
    color: SafeHarbor.colors.text,
  },
  valueDisplay: { alignItems: 'center', marginTop: 12 },
  valueBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 22,
    fontWeight: '700',
    color: SafeHarbor.colors.white,
  },
});
