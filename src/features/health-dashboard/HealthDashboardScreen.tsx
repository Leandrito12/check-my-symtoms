import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { CartesianChart, Line } from 'victory-native';
import { useFont } from '@shopify/react-native-skia';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { useAuth } from '@/src/hooks/useAuth';
import { useHealthAnalytics, type HealthAnalyticsRange, type HealthAnalyticsRangeOrNone } from '@/src/hooks/useHealthAnalytics';
import { fetchSymptoms } from '@/src/useCases/fetchSymptoms';
import { devLog } from '@/src/utils/devLog';
import { AnomalyAlert } from '@/src/components/AnomalyAlert';
import type { SymptomMaster } from '@/src/domain/types';
import { SymptomFilterDropdown } from './SymptomFilterDropdown';
import {
  logsToChartPoints,
  logsToBloodPressurePoints,
  logsToSymptomFrequency,
} from './utils';
import { ChartCard } from './ChartCard';
import { PressureMapChart } from './PressureMapChart';
import { SymptomFrequencyBarChart } from './SymptomFrequencyBarChart';
import { SymptomTrendChart } from './SymptomTrendChart';

const RANGE_OPTIONS: { key: HealthAnalyticsRange; label: string }[] = [
  { key: '1d', label: 'Día' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
];

const DESKTOP_BREAKPOINT = 600;

export function HealthDashboardScreen() {
  const { user } = useAuth();
  const [range, setRange] = useState<HealthAnalyticsRangeOrNone>('7d');

  const rangeDays = useMemo(() => {
    const map: Record<HealthAnalyticsRange, number> = { '1d': 1, '7d': 7, '30d': 30, '90d': 90 };
    return range === null ? 365 : map[range];
  }, [range]);

  const { data: logs, isLoading, isEmpty, userId } = useHealthAnalytics(range);
  const { data: allSymptoms = [] } = useQuery({
    queryKey: ['symptoms'],
    queryFn: fetchSymptoms,
    enabled: !!userId,
  });

  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const chartWidth = Math.min(width - 48, 400);
  const chartHeight = 200;

  const points = useMemo(() => logsToChartPoints(logs), [logs]);
  const bloodPressurePoints = useMemo(() => logsToBloodPressurePoints(logs), [logs]);
  const symptomFrequency = useMemo(() => logsToSymptomFrequency(logs), [logs]);

  const uniqueSymptomsByName = useMemo(() => {
    const byName = new Map<string, { name: string; ids: string[] }>();
    for (const l of logs) {
      if (!l.symptom_id || !l.symptom_name?.trim()) continue;
      const key = l.symptom_name.trim().toLowerCase();
      const existing = byName.get(key);
      if (existing) {
        if (!existing.ids.includes(l.symptom_id)) existing.ids.push(l.symptom_id);
      } else {
        byName.set(key, { name: l.symptom_name.trim(), ids: [l.symptom_id] });
      }
    }
    return Array.from(byName.values()).map((s) => ({
      name: s.name,
      firstId: s.ids[0],
      ids: s.ids,
    }));
  }, [logs]);

  const [selectedSymptom, setSelectedSymptom] = useState<SymptomMaster | null>(null);
  const selectedName = selectedSymptom?.name.trim().toLowerCase() ?? null;

  const prevRangeRef = useRef<HealthAnalyticsRangeOrNone>(range);
  const prevSelectedRef = useRef<SymptomMaster | null>(null);

  const symptomNamesStr = useMemo(
    () => uniqueSymptomsByName.map((s) => s.name).join(', '),
    [uniqueSymptomsByName]
  );

  useEffect(() => {
    devLog('Dashboard', 'Vista montada o datos cargados', {
      range,
      logsCount: logs.length,
      isEmpty,
      uniqueSymptomsCount: uniqueSymptomsByName.length,
      symptomOptionsNames: symptomNamesStr || '(ninguno)',
    });
  }, [range, logs.length, isEmpty, uniqueSymptomsByName.length, symptomNamesStr]);

  useEffect(() => {
    if (prevRangeRef.current !== range) {
      devLog('Dashboard', 'Cambio de rango (filtro tiempo)', {
        from: prevRangeRef.current,
        to: range,
      });
      prevRangeRef.current = range;
    }
  }, [range]);

  useEffect(() => {
    if (prevSelectedRef.current !== selectedSymptom) {
      devLog('Dashboard', 'Cambio de síntoma seleccionado (estado)', {
        from: prevSelectedRef.current?.name ?? null,
        to: selectedSymptom?.name ?? null,
        selectedId: selectedSymptom?.id ?? null,
      });
      prevSelectedRef.current = selectedSymptom;
    }
  }, [selectedSymptom]);

  const handleSymptomFilterChange = (item: SymptomMaster) => {
    devLog('Dashboard', 'Usuario eligió síntoma en filtro (onChange)', {
      name: item.name,
      id: item.id,
    });
    setSelectedSymptom(item);
  };

  const handleClearSymptomFilter = () => {
    devLog('Dashboard', 'Usuario pulsó Limpiar filtro');
    setSelectedSymptom(null);
  };

  const symptomOptions = useMemo(
    () => allSymptoms.map((s) => ({ id: s.id, name: s.name })),
    [allSymptoms]
  );

  const hasDataForSelectedSymptom = useMemo(() => {
    if (!selectedName) return false;
    return logs.some(
      (l) => l.symptom_name?.trim().toLowerCase() === selectedName
    );
  }, [logs, selectedName]);

  const symptomChartDataByName = useMemo(() => {
    if (!selectedName) return [];
    const days = rangeDays;
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);

    const filtered = logs.filter(
      (l) =>
        l.symptom_name?.trim().toLowerCase() === selectedName &&
        new Date(l.created_at) >= start &&
        new Date(l.created_at) <= end
    );

    const byDay = new Map<string, number>();
    for (let d = 0; d < days; d++) {
      const date = new Date(start);
      date.setDate(date.getDate() + d);
      const key = date.toISOString().slice(0, 10);
      byDay.set(key, 0);
    }
    for (const log of filtered) {
      const key = new Date(log.created_at).toISOString().slice(0, 10);
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }

    return Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, value: count }));
  }, [logs, selectedName, rangeDays]);

  const heartRateData = useMemo(
    () =>
      points
        .filter((p) => p.heartRate != null)
        .map((p) => ({ x: p.index, heartRate: p.heartRate!, label: p.label })),
    [points]
  );

  const heartRateDomain = useMemo(() => {
    if (heartRateData.length === 0)
      return { x: [-0.5, 0.5] as [number, number], y: [40, 120] as [number, number] };
    const vals = heartRateData.map((d) => d.heartRate);
    const minY = Math.min(...vals);
    const maxY = Math.max(...vals);
    const pad = Math.max((maxY - minY) * 0.15, 5);
    return {
      x: [-0.5, Math.max(heartRateData.length - 0.5, 0.5)] as [number, number],
      y: [Math.max(40, minY - pad), Math.min(180, maxY + pad)] as [number, number],
    };
  }, [heartRateData]);

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

  if (isEmpty) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Evolución de signos vitales</Text>
          <View style={styles.rangeSelector}>
            {RANGE_OPTIONS.map(({ key, label }) => (
              <Pressable
                key={key}
                style={[styles.rangeChip, range === key && styles.rangeChipSelected]}
                onPress={() => setRange((r) => (r === key ? null : key))}
              >
                <Text
                  style={[styles.rangeChipText, range === key && styles.rangeChipTextSelected]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
            {range !== null && (
              <Pressable style={styles.rangeChipClear} onPress={() => setRange(null)}>
                <Text style={styles.rangeChipClearText}>Limpiar</Text>
              </Pressable>
            )}
          </View>
        </View>
        <Text style={styles.empty}>
          No hay registros en este periodo. Añade síntomas con presión o frecuencia cardíaca para
          ver los gráficos.
        </Text>
        {allSymptoms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Por síntoma</Text>
            {selectedSymptom ? (
              <View style={styles.currentFilterBadge}>
                <Text style={styles.currentFilterLabel}>Filtro activo:</Text>
                <Text style={styles.currentFilterName} numberOfLines={1}>
                  {selectedSymptom.name}
                </Text>
                <Pressable
                  style={styles.clearSymptomBtnInline}
                  onPress={handleClearSymptomFilter}
                >
                  <Text style={styles.clearSymptomText}>Limpiar</Text>
                </Pressable>
              </View>
            ) : null}
            <View style={styles.symptomFilterRow}>
              <View style={styles.symptomDropdownWrap}>
                <SymptomFilterDropdown
                  options={symptomOptions}
                  value={selectedSymptom}
                  onChange={handleSymptomFilterChange}
                  placeholder="Escribe o elige un síntoma..."
                />
              </View>
            </View>
            {selectedSymptom && (
              <View style={styles.symptomNoDataPlaceholder}>
                <Text style={styles.symptomNoDataText}>
                  No hay datos asociados a este síntoma.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Evolución de signos vitales</Text>
        <View style={styles.rangeSelector}>
          {RANGE_OPTIONS.map(({ key, label }) => (
            <Pressable
              key={key}
              style={[styles.rangeChip, range === key && styles.rangeChipSelected]}
              onPress={() => setRange((r) => (r === key ? null : key))}
            >
              <Text
                style={[styles.rangeChipText, range === key && styles.rangeChipTextSelected]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
          {range !== null && (
            <Pressable style={styles.rangeChipClear} onPress={() => setRange(null)}>
              <Text style={styles.rangeChipClearText}>Limpiar</Text>
            </Pressable>
          )}
        </View>
      </View>

      <AnomalyAlert isAnomaly={false} />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Por síntoma</Text>
        {allSymptoms.length > 0 ? (
          <>
            {selectedSymptom ? (
              <View style={styles.currentFilterBadge}>
                <Text style={styles.currentFilterLabel}>Filtro activo:</Text>
                <Text style={styles.currentFilterName} numberOfLines={1}>
                  {selectedSymptom.name}
                </Text>
                <Pressable
                  style={styles.clearSymptomBtnInline}
                  onPress={handleClearSymptomFilter}
                >
                  <Text style={styles.clearSymptomText}>Limpiar</Text>
                </Pressable>
              </View>
            ) : null}
            <View style={styles.symptomFilterRow}>
              <View style={styles.symptomDropdownWrap}>
                <SymptomFilterDropdown
                  options={symptomOptions}
                  value={selectedSymptom}
                  onChange={handleSymptomFilterChange}
                  placeholder="Escribe o elige un síntoma..."
                />
              </View>
            </View>
            {selectedSymptom &&
              (hasDataForSelectedSymptom ? (
                <SymptomTrendChart
                  title={`${selectedSymptom.name} – veces por día`}
                  data={symptomChartDataByName.map((d) => ({ date: d.date, value: d.value }))}
                  emptyMessage="No hay registros en este período. Registra síntomas para ver la evolución."
                  showDateLabels
                />
              ) : (
                <View style={styles.symptomNoDataPlaceholder}>
                  <Text style={styles.symptomNoDataText}>
                    No hay datos asociados a este síntoma.
                  </Text>
                </View>
              ))}
          </>
        ) : (
          <Text style={styles.sectionHint}>
            No hay síntomas disponibles. Añade síntomas en la app para filtrar por uno.
          </Text>
        )}
      </View>

      {isDesktop ? (
        <View style={styles.desktopRow}>
          <View style={styles.desktopCol60}>
            <PressureMapChart
              data={bloodPressurePoints}
              emptyMessage="Sin datos de presión en este periodo."
            />
          </View>
          <View style={styles.desktopCol40}>
            <SymptomFrequencyBarChart
              data={symptomFrequency}
              selectedSymptomName={selectedName}
              emptyMessage="Sin registros de síntomas en este periodo."
            />
          </View>
        </View>
      ) : (
        <>
          <PressureMapChart
            data={bloodPressurePoints}
            emptyMessage="Sin datos de presión en este periodo."
          />
          <SymptomFrequencyBarChart
            data={symptomFrequency}
            selectedSymptomName={selectedName}
            emptyMessage="Sin registros de síntomas en este periodo."
          />
        </>
      )}

      {heartRateData.length > 0 && (
        <ChartCard title="Frecuencia cardíaca (lpm)">
          <View style={[styles.chartWrap, { width: chartWidth, height: chartHeight }]}>
            <CartesianChart
              data={heartRateData}
              xKey="x"
              yKeys={['heartRate']}
              domain={heartRateDomain}
              padding={{ left: 44, right: 12, top: 16, bottom: 32 }}
              domainPadding={{ left: 8, right: 8, top: 16, bottom: 16 }}
              axisOptions={{
                font: font ?? undefined,
                tickCount: { x: Math.min(6, heartRateData.length), y: 5 },
                labelColor: { x: SafeHarbor.colors.text, y: SafeHarbor.colors.text },
                lineColor: {
                  grid: { x: SafeHarbor.colors.border, y: SafeHarbor.colors.border },
                  frame: SafeHarbor.colors.border,
                },
                formatYLabel: (v) => `${Math.round(v)}`,
              }}
            >
              {({ points: pts }) => (
                <Line
                  points={pts.heartRate}
                  color={SafeHarbor.colors.primary}
                  strokeWidth={2}
                  curveType="linear"
                  animate={{ type: 'timing', duration: 400 }}
                />
              )}
            </CartesianChart>
          </View>
        </ChartCard>
      )}

      {heartRateData.length === 0 &&
        bloodPressurePoints.length === 0 &&
        symptomFrequency.length === 0 &&
        points.length > 0 && (
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: SafeHarbor.colors.text,
  },
  rangeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  rangeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SafeHarbor.spacing.cardRadius,
    backgroundColor: SafeHarbor.colors.commentBg,
  },
  rangeChipSelected: { backgroundColor: SafeHarbor.colors.primary },
  rangeChipText: { fontSize: 13, color: SafeHarbor.colors.text },
  rangeChipTextSelected: { color: SafeHarbor.colors.white, fontWeight: '600' },
  rangeChipClear: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SafeHarbor.spacing.cardRadius,
    backgroundColor: SafeHarbor.colors.commentBg,
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
  },
  rangeChipClearText: { fontSize: 13, color: SafeHarbor.colors.textSecondary },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: SafeHarbor.colors.text,
    marginBottom: 10,
  },
  sectionHint: {
    fontSize: 13,
    color: SafeHarbor.colors.textSecondary,
    marginBottom: 8,
  },
  symptomFilterRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  symptomDropdownWrap: { flex: 1, minWidth: 0 },
  clearSymptomBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  clearSymptomText: {
    fontSize: 14,
    color: SafeHarbor.colors.white,
    fontWeight: '600',
  },
  currentFilterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: SafeHarbor.colors.primary,
    borderRadius: 8,
    width: '100%',
  },
  currentFilterLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  currentFilterName: {
    fontSize: 14,
    fontWeight: '700',
    color: SafeHarbor.colors.white,
    flex: 1,
  },
  clearSymptomBtnInline: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  symptomNoDataPlaceholder: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: SafeHarbor.colors.commentBg,
    borderRadius: 8,
    marginTop: 8,
  },
  symptomNoDataText: {
    fontSize: 14,
    color: SafeHarbor.colors.textSecondary,
    textAlign: 'center',
  },
  desktopRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  desktopCol60: { flex: 0.6 },
  desktopCol40: { flex: 0.4 },
  chartWrap: {
    overflow: 'hidden',
    borderRadius: 4,
  },
  empty: {
    fontSize: 14,
    color: SafeHarbor.colors.text,
    opacity: 0.8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: { fontSize: 16, color: SafeHarbor.colors.text },
});
