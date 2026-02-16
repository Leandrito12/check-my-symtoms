/**
 * Adaptador: respuesta shared-history → datos para PressureMapChart y SymptomFrequencyBarChart.
 * Si el backend envía symptom_frequency pre-calculado, se usa directamente (sin iterar logs).
 * Plan Historial Compartido con el Médico (F2).
 */

import type { SharedHistoryResponse } from '@/src/useCases/fetchSharedHistory';
import type { BloodPressurePoint } from '../utils';
import type { SymptomFrequencyItem } from '../utils';
import { computeMap } from '../utils';

/**
 * Convierte analytics.history (o logs con presión) a BloodPressurePoint[].
 * Backend puede enviar: (a) period + avg_map, o (b) date + systolic + diastolic.
 */
export function mapSharedHistoryToPressure(
  data: SharedHistoryResponse
): BloodPressurePoint[] {
  const history = data.analytics?.history;
  if (Array.isArray(history) && history.length > 0) {
    const withSystolicDiastolic = history.some(
      (h) => h.systolic != null || h.diastolic != null
    );
    if (withSystolicDiastolic) {
      return history
        .map((h, i) => {
          const s = h.systolic ?? null;
          const d = h.diastolic ?? null;
          if (s == null || d == null) return null;
          const date = h.date ?? h.period ?? '';
          return {
            index: i,
            date,
            label: date
              ? new Date(date).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                })
              : `${i}`,
            systolic: s,
            diastolic: d,
            map: h.map ?? computeMap(s, d),
          };
        })
        .filter((p): p is BloodPressurePoint => p != null);
    }
    const avgMapPoints = history
      .map((h, i) => {
        const date = h.period ?? h.date ?? '';
        const avgMap = h.avg_map ?? h.map;
        if (avgMap == null || !date) return null;
        return {
          index: i,
          date,
          label: new Date(date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
          }),
          systolic: avgMap,
          diastolic: avgMap,
          map: avgMap,
        };
      })
      .filter((p): p is BloodPressurePoint => p != null);
    if (avgMapPoints.length > 0) return avgMapPoints;
  }
  // Fallback: derivar de logs que tengan presión
  const logs = data.logs ?? [];
  const withPressure = logs
    .map((log) => {
      const sys = log.details?.pressure?.systolic ?? null;
      const dia = log.details?.pressure?.diastolic ?? null;
      if (sys == null || dia == null) return null;
      return {
        date: log.created_at,
        systolic: sys,
        diastolic: dia,
      };
    })
    .filter((p): p is { date: string; systolic: number; diastolic: number } => p != null);
  const sorted = [...withPressure].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  return sorted.map((p, i) => ({
    index: i,
    date: p.date,
    label: new Date(p.date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
    }),
    systolic: p.systolic,
    diastolic: p.diastolic,
    map: computeMap(p.systolic, p.diastolic),
  }));
}

/**
 * Convierte analytics.symptom_frequency (pre-calculado) o logs a SymptomFrequencyItem[].
 * Usa symptom_frequency directamente cuando existe para evitar iterar todos los logs.
 */
export function mapSharedHistoryToSymptomFrequency(
  data: SharedHistoryResponse
): SymptomFrequencyItem[] {
  const raw = data.analytics?.symptom_frequency;
  if (raw != null) {
    if (Array.isArray(raw)) {
      return raw
        .map((item) => {
          const id =
            ('symptom_id' in item && typeof (item as { symptom_id?: string }).symptom_id === 'string'
              ? (item as { symptom_id: string }).symptom_id
              : null) ??
            (item.symptom_name?.toLowerCase() ?? '');
          return {
            symptomId: id,
            symptomName: item.symptom_name ?? '',
            count: item.count ?? 0,
          };
        })
        .filter((s) => s.symptomName)
        .sort((a, b) => b.count - a.count);
    }
    if (typeof raw === 'object' && !Array.isArray(raw)) {
      return Object.entries(raw)
        .map(([name, count]) => ({
          symptomId: name.toLowerCase(),
          symptomName: name,
          count: Number(count) || 0,
        }))
        .filter((s) => s.symptomName)
        .sort((a, b) => b.count - a.count);
    }
  }
  // Fallback: agrupar por nombre desde logs
  const logs = data.logs ?? [];
  const byName = new Map<string, { id: string; name: string; count: number }>();
  for (const log of logs) {
    const name = log.primary_symptom_name ?? log.symptom_name ?? '';
    if (!name.trim()) continue;
    const key = name.trim().toLowerCase();
    const existing = byName.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      byName.set(key, {
        id: log.symptom_id ?? key,
        name: name.trim(),
        count: 1,
      });
    }
  }
  return Array.from(byName.values())
    .map(({ id, name, count }) => ({ symptomId: id, symptomName: name, count }))
    .sort((a, b) => b.count - a.count);
}
