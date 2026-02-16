/**
 * Badge de anomalía (ej. variación inusual en pulso). Dismissible para no ocupar
 * espacio de forma permanente. Plan refinado Fase 2.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeHarbor } from '@/constants/SafeHarbor';

interface AnomalyAlertProps {
  /** Cuando true, muestra la alerta (backend anomaly). */
  isAnomaly: boolean | undefined;
  /** Mensaje opcional. Por defecto: variación en pulso últimos 3 días. */
  message?: string;
}

export function AnomalyAlert({ isAnomaly, message }: AnomalyAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!isAnomaly || dismissed) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {message ?? 'Variación inusual en el pulso detectada (últimos 3 días).'}
      </Text>
      <Pressable
        onPress={() => setDismissed(true)}
        style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
        accessibilityLabel="Cerrar aviso"
      >
        <Text style={styles.closeText}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    marginBottom: 16,
  },
  text: {
    flex: 1,
    color: '#E65100',
    fontWeight: '600',
    fontSize: 13,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 4,
  },
  closeBtnPressed: {
    opacity: 0.7,
  },
  closeText: {
    fontSize: 20,
    color: '#E65100',
    lineHeight: 22,
  },
});
