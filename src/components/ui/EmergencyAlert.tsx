import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { Button } from './Button';

/**
 * Estrategia de Emergencia (Strategy Pattern): único elemento en pantalla con color Alerta.
 * Dolor 8+ → captar atención y redirigir a llamada de emergencia.
 */
export function EmergencyAlert() {
  const handleCall911 = () => {
    Linking.openURL('tel:911');
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>DOLOR EXTREMO</Text>
      <Text style={styles.subtitle}>Considera ir a urgencias</Text>
      <Button
        title="LLAMAR 911"
        variant="alert"
        onPress={handleCall911}
        fullWidth
        style={[styles.button, { borderWidth: 2, borderColor: SafeHarbor.colors.white }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SafeHarbor.colors.alert,
    borderRadius: SafeHarbor.spacing.cardRadius,
    padding: 20,
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: SafeHarbor.colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: SafeHarbor.colors.white,
    opacity: 0.95,
    marginBottom: 16,
  },
  button: {},
});
