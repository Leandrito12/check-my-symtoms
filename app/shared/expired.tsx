/**
 * Pantalla Acceso Expirado: token inválido o expirado.
 * Plan Historial Compartido con el Médico (P4).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { Button } from '@/src/components/ui';

export default function ExpiredScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acceso expirado</Text>
      <Text style={styles.message}>
        El enlace de visualización no es válido o ha caducado. Pide al paciente que te
        comparta un nuevo enlace desde su app.
      </Text>
      <Button
        title="Solicitar nuevo acceso"
        variant="primary"
        onPress={() => router.push('/doctor/request' as never)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: SafeHarbor.colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: SafeHarbor.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: SafeHarbor.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
});
