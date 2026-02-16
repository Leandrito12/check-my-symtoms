/**
 * Wrapper anti-desborde para gráficos. Mantiene título, fondo, sombra y overflow hidden
 * para que el contenido (SVG/Skia) no pise los bordes. Plan refinado Fase 1/3.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeHarbor } from '@/constants/SafeHarbor';

interface ChartCardProps {
  title: string;
  /** Opcional cuando empty es true (se muestra emptyMessage). */
  children?: React.ReactNode;
  /** Si true, muestra emptyMessage en lugar de children (no renderizar Victory con array vacío). */
  empty?: boolean;
  emptyMessage?: string;
  /** Si true, el contenido ocupa todo el ancho del contenedor (ej. lista de frecuencia). */
  fullWidth?: boolean;
}

export function ChartCard({ title, children, empty, emptyMessage, fullWidth }: ChartCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={[styles.chartWrapper, fullWidth && styles.chartWrapperFullWidth]}>
        {empty ? (
          <Text style={styles.empty}>{emptyMessage ?? 'Sin datos en este periodo.'}</Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SafeHarbor.colors.white,
    borderRadius: SafeHarbor.spacing.cardRadius,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: SafeHarbor.colors.text,
    marginBottom: 12,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 4,
  },
  chartWrapperFullWidth: {
    alignItems: 'stretch',
    width: '100%',
  },
  empty: {
    fontSize: 14,
    color: SafeHarbor.colors.textSecondary,
    paddingVertical: 24,
  },
});
