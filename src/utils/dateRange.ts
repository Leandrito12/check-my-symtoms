/**
 * Rangos de fecha para agrupar/compartir registros de salud.
 * Usado en Inicio (agrupar por rango) y en el compartido de bundle (1 link por rango).
 * Los chequeos médicos suelen ser cada ~30 días → 30D es el rango por defecto.
 */
export type DateRange = '1d' | '7d' | '30d' | '60d' | '90d';

export const DATE_RANGES: DateRange[] = ['1d', '7d', '30d', '60d', '90d'];

export const DATE_RANGE_DAYS: Record<DateRange, number> = {
  '1d': 1,
  '7d': 7,
  '30d': 30,
  '60d': 60,
  '90d': 90,
};

/** Etiqueta corta para los chips (1D, 7D, 30D, 60D, 90D). */
export const DATE_RANGE_LABELS: Record<DateRange, string> = {
  '1d': '1D',
  '7d': '7D',
  '30d': '30D',
  '60d': '60D',
  '90d': '90D',
};

/** Etiqueta larga para encabezados de sección ("Últimos 30 días"). */
export function dateRangeTitle(range: DateRange): string {
  const days = DATE_RANGE_DAYS[range];
  return days === 1 ? 'Últimas 24 horas' : `Últimos ${days} días`;
}

/**
 * Límites [from, to] del rango, en hora LOCAL: desde el inicio del primer día
 * hasta el fin del día de hoy. Devuelve Date; usar toISOString() para el backend.
 */
export function rangeBounds(range: DateRange): { from: Date; to: Date } {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date(to);
  from.setDate(from.getDate() - DATE_RANGE_DAYS[range] + 1);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

/** Filtra una lista de logs (con created_at ISO) al rango indicado. */
export function filterByRange<T extends { created_at: string }>(
  logs: T[],
  range: DateRange
): T[] {
  const { from, to } = rangeBounds(range);
  const fromMs = from.getTime();
  const toMs = to.getTime();
  return logs.filter((log) => {
    const t = new Date(log.created_at).getTime();
    return t >= fromMs && t <= toMs;
  });
}
