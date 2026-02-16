/**
 * Gráfico de evolución por síntoma (datos de get-patient-analytics).
 * Safe Harbor + Victory Native.
 */
import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { useFont } from '@shopify/react-native-skia';
import { SafeHarbor } from '@/constants/SafeHarbor';
import type { PatientAnalyticsPoint } from '@/src/domain/api';

interface SymptomTrendChartProps {
  title: string;
  data: PatientAnalyticsPoint[];
  emptyMessage?: string;
  /** Si true, el eje X muestra fechas (día/mes) en lugar del índice. */
  showDateLabels?: boolean;
}

const chartHeight = 200;

export function SymptomTrendChart({
  title,
  data,
  emptyMessage,
  showDateLabels = false,
}: SymptomTrendChartProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - 48, 400);
  const font = useFont(require('../../../assets/fonts/SpaceMono-Regular.ttf'), 11);

  const chartData = data.map((d, i) => ({
    x: i,
    value: d.value,
    label: d.date,
  }));

  const values = chartData.map((d) => d.value);
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 10;
  const yPadding = Math.max((maxVal - minVal) * 0.2, 1);
  const yDomain: [number, number] = [minVal - yPadding, maxVal + yPadding];
  const xDomain: [number, number] = [
    -0.5,
    Math.max(chartData.length - 0.5, 0.5),
  ];

  if (data.length === 0) {
    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{title}</Text>
        <Text style={styles.empty}>
          {emptyMessage ?? 'Registra tu primer síntoma para ver la evolución.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={[styles.chartWrap, { width: chartWidth, height: chartHeight }]}>
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={['value']}
          domain={{ x: xDomain, y: yDomain }}
          padding={{ left: 44, right: 12, top: 16, bottom: 32 }}
          domainPadding={{ left: 8, right: 8, top: 16, bottom: 16 }}
          axisOptions={{
            font: font ?? undefined,
            tickCount: { x: Math.min(6, chartData.length), y: 5 },
            labelColor: { x: SafeHarbor.colors.text, y: SafeHarbor.colors.text },
            lineColor: {
              grid: { x: SafeHarbor.colors.border, y: SafeHarbor.colors.border },
              frame: SafeHarbor.colors.border,
            },
            formatYLabel: (v) => `${Math.round(v)}`,
            formatXLabel: showDateLabels
              ? (value) => {
                  const i = Math.round(value);
                  const d = data[i];
                  if (!d?.date) return '';
                  return new Date(d.date).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                  });
                }
              : undefined,
          }}
        >
          {({ points: pts }) => (
            <Line
              points={pts.value}
              color={SafeHarbor.colors.primary}
              strokeWidth={2}
              curveType="linear"
              animate={{ type: 'timing', duration: 400 }}
            />
          )}
        </CartesianChart>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  chartWrap: {
    overflow: 'hidden',
    borderRadius: 4,
  },
  empty: {
    fontSize: 14,
    color: SafeHarbor.colors.text,
    opacity: 0.8,
  },
});
