import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeHarbor } from '@/constants/SafeHarbor';
import type { PainLevel } from '@/src/domain/types';

function getColor(level: number): string {
  if (level <= 3) return SafeHarbor.painLevelColors.calm;
  if (level <= 5) return SafeHarbor.painLevelColors.attention;
  return SafeHarbor.painLevelColors.alert;
}

interface PainSliderProps {
  value: PainLevel;
  onChange: (value: PainLevel) => void;
  label?: string;
}

const LEVELS: PainLevel[] = [0, 1, 2, 3, 4, 5, 6, 7];

export function PainSlider({ value, onChange, label = 'Nivel de Dolor (0-7)' }: PainSliderProps) {
  const handleValueChange = (v: number) => {
    const rounded = Math.round(v) as PainLevel;
    const clamped = LEVELS.includes(rounded) ? rounded : (Math.min(7, Math.max(0, rounded)) as PainLevel);
    onChange(clamped);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={7}
        step={1}
        value={value}
        onValueChange={handleValueChange}
        minimumTrackTintColor={getColor(value)}
        maximumTrackTintColor={SafeHarbor.colors.border}
        thumbTintColor={getColor(value)}
        tapToSeek
      />
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
  slider: {
    width: '100%',
    height: 40,
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
