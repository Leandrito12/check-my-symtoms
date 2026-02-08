import type { HealthLogForPatient } from '@/src/useCases/fetchHealthLogsForPatient';

/** Parsea "120/80" -> 120 (sistólica). Devuelve null si no hay o no es válido. */
export function parseSystolic(bloodPressure: string | null): number | null {
  if (!bloodPressure?.trim()) return null;
  const parts = bloodPressure.split('/').map((s) => s.trim());
  const systolic = parts[0] ? parseInt(parts[0], 10) : NaN;
  return Number.isNaN(systolic) ? null : systolic;
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

/** Convierte logs a puntos para gráficos (índice, etiqueta fecha, FC, sistólica). */
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
    systolic: parseSystolic(log.blood_pressure),
  }));
}
