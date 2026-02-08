import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { CartesianChart, Line } from 'victory-native';
import { useFont } from '@shopify/react-native-skia';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { useAuth } from '@/src/hooks/useAuth';
import { fetchHealthLogsForPatient } from '@/src/useCases';
import { logsToChartPoints } from './utils';

export function HealthDashboardScreen() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - 48, 400);
  const chartHeight = 200;

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['health-logs', userId],
    queryFn: () => fetchHealthLogsForPatient(userId),
    enabled: !!userId,
  });

  const points = useMemo(() => logsToChartPoints(logs), [logs]);
  const heartRateData = useMemo(
    () => points.filter((p) => p.heartRate != null).map((p) => ({ x: p.index, heartRate: p.heartRate!, label: p.label })),
    [points]
  );
  const systolicData = useMemo(
    () => points.filter((p) => p.systolic != null).map((p) => ({ x: p.index, systolic: p.systolic!, label: p.label })),
    [points]
  );

  const font = useFont(require('../../../assets/fonts/SpaceMono-Regular.ttf'), 11);

  if (!userId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Inicia sesión para ver tu evolución.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Cargando datos…</Text>
      </View>
    );
  }

  if (points.length === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Evolución de signos vitales</Text>
        <Text style={styles.empty}>
          Aún no hay registros con presión o frecuencia cardíaca. Añade síntomas con esos datos para ver los gráficos.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Evolución de signos vitales</Text>

      {heartRateData.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Frecuencia cardíaca (lpm)</Text>
          <View style={[styles.chartWrap, { width: chartWidth, height: chartHeight }]}>
            <CartesianChart
              data={heartRateData}
              xKey="x"
              yKeys={['heartRate']}
              domain={{ y: [40, 120] }}
              axisOptions={{
                font: font ?? undefined,
                tickCount: { x: 5, y: 5 },
                labelColor: { x: SafeHarbor.colors.text, y: SafeHarbor.colors.text },
                lineColor: { grid: { x: SafeHarbor.colors.border, y: SafeHarbor.colors.border }, frame: SafeHarbor.colors.border },
                formatYLabel: (v) => `${Math.round(v)}`,
              }}
            >
              {({ points: pts }) => (
                <Line
                  points={pts.heartRate}
                  color={SafeHarbor.colors.primary}
                  strokeWidth={2}
                  curveType="natural"
                  animate={{ type: 'timing', duration: 400 }}
                />
              )}
            </CartesianChart>
          </View>
        </View>
      )}

      {systolicData.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Presión arterial – sistólica (mmHg)</Text>
          <View style={[styles.chartWrap, { width: chartWidth, height: chartHeight }]}>
            <CartesianChart
              data={systolicData}
              xKey="x"
              yKeys={['systolic']}
              domain={{ y: [80, 180] }}
              axisOptions={{
                font: font ?? undefined,
                tickCount: { x: 5, y: 5 },
                labelColor: { x: SafeHarbor.colors.text, y: SafeHarbor.colors.text },
                lineColor: { grid: { x: SafeHarbor.colors.border, y: SafeHarbor.colors.border }, frame: SafeHarbor.colors.border },
                formatYLabel: (v) => `${Math.round(v)}`,
              }}
            >
              {({ points: pts }) => (
                <Line
                  points={pts.systolic}
                  color={SafeHarbor.colors.secondary}
                  strokeWidth={2}
                  curveType="natural"
                  animate={{ type: 'timing', duration: 400 }}
                />
              )}
            </CartesianChart>
          </View>
        </View>
      )}

      {heartRateData.length === 0 && systolicData.length === 0 && points.length > 0 && (
        <Text style={styles.empty}>
          Ningún registro tiene presión o FC. Añade esos datos al registrar síntomas.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SafeHarbor.colors.background },
  scrollContent: { padding: 24, paddingBottom: 48 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: SafeHarbor.colors.text,
    marginBottom: 20,
  },
  chartCard: {
    backgroundColor: SafeHarbor.colors.white,
    borderRadius: SafeHarbor.spacing.cardRadius,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: SafeHarbor.colors.text,
    marginBottom: 12,
  },
  chartWrap: { overflow: 'hidden' },
  empty: {
    fontSize: 14,
    color: SafeHarbor.colors.text,
    opacity: 0.8,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message: { fontSize: 16, color: SafeHarbor.colors.text },
});
