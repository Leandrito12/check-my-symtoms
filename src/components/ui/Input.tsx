import React from 'react';
import { TextInput, View, Text, StyleSheet, type TextInputProps } from 'react-native';
import { SafeHarbor } from '@/constants/SafeHarbor';

const MIN_TAP = SafeHarbor.spacing.minTapTarget;

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={SafeHarbor.colors.border}
        style={[
          styles.input,
          { minHeight: MIN_TAP, borderColor: error ? SafeHarbor.colors.alert : SafeHarbor.colors.border },
          style,
        ]}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: {
    color: SafeHarbor.colors.text,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: SafeHarbor.spacing.cardRadius,
    paddingHorizontal: 14,
    backgroundColor: SafeHarbor.colors.white,
    color: SafeHarbor.colors.text,
    fontSize: 16,
  },
  errorText: {
    color: SafeHarbor.colors.alert,
    fontSize: 12,
    marginTop: 4,
  },
});
