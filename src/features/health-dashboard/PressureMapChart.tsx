/**
 * Gráfico de presión arterial: sistólica, diastólica y MAP. Leyenda y Safe-Zone.
 * Plan refinado Fase 3. MAP con color distintivo (trazo discontinuo si la librería lo permite).
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { useFont } from '@shopify/react-native-skia';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { ChartCard } from './ChartCard';
import type { BloodPressurePoint } from './utils';

const CHART_HEIGHT = 240;

const COLOR_SYSTOLIC = '#E11D48';
const COLOR_DIASTOLIC = '#0F52BA';
const COLOR_MAP = '#10B981';

interface PressureMapChartProps {
  data: BloodPressurePoint[];
  emptyMessage?: string;
  /** Altura explícita para el gráfico (evita fallos SVG/web con flex sin altura). */
  height?: number;
}

export function PressureMapChart({ data, emptyMessage, height = CHART_HEIGHT }: PressureMapChartProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - 48, 400);
  const font = useFont(require('../../../assets/fonts/SpaceMono-Regular.ttf'), 11);

  const chartData = useMemo(
    () =>
      data.map((p) => ({
        x: p.index,
        systolic: p.systolic,
        diastolic: p.diastolic,
        map: p.map,
        label: p.label,
      })),
    [data]
  );

  const domain = useMemo(() => {
    if (chartData.length === 0)
      return { x: [-0.5, 0.5] as [number, number], y: [60, 180] as [number, number] };
    const all = chartData.flatMap((d) => [d.systolic, d.diastolic, d.map]);
    const minY = Math.max(50, Math.min(...all) - 10);
    const maxY = Math.min(220, Math.max(...all) + 10);
    return {
      x: [-0.5, Math.max(chartData.length - 0.5, 0.5)] as [number, number],
      y: [minY, maxY] as [number, number],
    };
  }, [chartData]);

  if (data.length === 0) {
    return (
      <ChartCard
        title="Presión arterial (mmHg)"
        empty
        emptyMessage={emptyMessage ?? 'Sin datos de presión en este periodo.'}
      />
    );
  }

  return (
    <ChartCard title="Presión arterial (mmHg)">
      <View style={[styles.chartWrap, { width: chartWidth, height }]}>
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={['systolic', 'diastolic', 'map']}
          domain={domain}
          padding={{ left: 50, right: 20, top: 12, bottom: 36 }}
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
            formatXLabel: (value) => {
              const i = Math.round(value);
              const p = data[i];
              return p?.label ?? '';
            },
          }}
        >
          {({ points: pts }) => (
            <>
              <Line
                points={pts.systolic}
                color={COLOR_SYSTOLIC}
                strokeWidth={2}
                curveType="linear"
                animate={{ type: 'timing', duration: 400 }}
              />
              <Line
                points={pts.diastolic}
                color={COLOR_DIASTOLIC}
                strokeWidth={2}
                curveType="linear"
                animate={{ type: 'timing', duration: 400 }}
              />
              <Line
                points={pts.map}
                color={COLOR_MAP}
                strokeWidth={2}
                curveType="linear"
                animate={{ type: 'timing', duration: 400 }}
              />
            </>
          )}
        </CartesianChart>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLOR_SYSTOLIC }]} />
          <Text style={styles.legendText}>Sistólica</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLOR_DIASTOLIC }]} />
          <Text style={styles.legendText}>Diastólica</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLOR_MAP }]} />
          <Text style={styles.legendText}>MAP</Text>
        </View>
      </View>
    </ChartCard>
  );
}

const styles = StyleSheet.create({
  chartWrap: {
    overflow: 'hidden',
    borderRadius: 4,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: SafeHarbor.colors.text,
  },
});
