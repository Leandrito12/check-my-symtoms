import type { HealthLogForPatient } from '@/src/useCases/fetchHealthLogsForPatient';

function toNum(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Obtiene sistólica desde details.pressure (o string desde API). */
function getSystolic(log: HealthLogForPatient): number | null {
  return toNum(log.details?.pressure?.systolic) ?? null;
}

/** Obtiene diastólica desde details.pressure (o string desde API). */
function getDiastolic(log: HealthLogForPatient): number | null {
  return toNum(log.details?.pressure?.diastolic) ?? null;
}

/** MAP = (2 * diastolic + systolic) / 3. */
export function computeMap(systolic: number, diastolic: number): number {
  return Math.round((2 * diastolic + systolic) / 3);
}

/** Ordena logs por fecha ascendente (más antiguo primero) para gráficos en el tiempo. */
export function sortLogsForCharts(logs: HealthLogForPatient[]): HealthLogForPatient[] {
  return [...logs].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export interface ChartPoint {
  index: number;
  date: string;
  label: string;
  heartRate: number | null;
  systolic: number | null;
}

/** Convierte logs a puntos para gráficos (índice, etiqueta fecha, FC, sistólica). C01: presión desde details. */
export function logsToChartPoints(logs: HealthLogForPatient[]): ChartPoint[] {
  const sorted = sortLogsForCharts(logs);
  return sorted.map((log, i) => ({
    index: i,
    date: log.created_at,
    label: new Date(log.created_at).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
    }),
    heartRate: log.heart_rate ?? null,
    systolic: getSystolic(log),
  }));
}

export interface BloodPressurePoint {
  index: number;
  date: string;
  label: string;
  systolic: number;
  diastolic: number;
  map: number;
}

/** Convierte logs a puntos para gráfico de presión (sistólica, diastólica, MAP). */
export function logsToBloodPressurePoints(logs: HealthLogForPatient[]): BloodPressurePoint[] {
  const sorted = sortLogsForCharts(logs);
  const result: BloodPressurePoint[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const log = sorted[i]!;
    const s = getSystolic(log);
    const d = getDiastolic(log);
    if (s == null || d == null) continue;
    result.push({
      index: i,
      date: log.created_at,
      label: new Date(log.created_at).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
      }),
      systolic: s,
      diastolic: d,
      map: computeMap(s, d),
    });
  }
  return result;
}

export interface SymptomFrequencyItem {
  symptomId: string;
  symptomName: string;
  count: number;
}

const MAX_SYMPTOM_NAME_LENGTH = 20;

/** Trunca nombre de síntoma para ejes. Plan refinado: evitar desborde. */
export function truncateSymptomName(name: string, maxLen: number = MAX_SYMPTOM_NAME_LENGTH): string {
  const t = name.trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen - 1).trim() + '…';
}

/** Convierte logs a frecuencia por síntoma (nombre normalizado). Para gráfico de barras. */
export function logsToSymptomFrequency(logs: HealthLogForPatient[]): SymptomFrequencyItem[] {
  const byKey = new Map<string, { name: string; id: string; count: number }>();
  for (const log of logs) {
    if (!log.symptom_id || !log.symptom_name?.trim()) continue;
    const key = log.symptom_name.trim().toLowerCase();
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      byKey.set(key, {
        id: log.symptom_id,
        name: log.symptom_name.trim(),
        count: 1,
      });
    }
  }
  return Array.from(byKey.values())
    .map(({ id, name, count }) => ({ symptomId: id, symptomName: name, count }))
    .sort((a, b) => b.count - a.count);
}
