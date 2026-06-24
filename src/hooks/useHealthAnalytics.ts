/**
 * Hook de analíticas del dashboard. Comparte la query key ['health-logs', userId]
 * con Inicio (mismo fetch) para que UNA sola petición y UNA sola invalidación cubran
 * ambas vistas. El rango (1d/7d/30d/90d) se filtra en cliente, no en la key.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { fetchHealthLogsForPatient } from '@/src/useCases/fetchHealthLogsForPatient';

export type HealthAnalyticsRange = '1d' | '7d' | '30d' | '90d';

const RANGE_DAYS: Record<HealthAnalyticsRange, number> = {
  '1d': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

function filterLogsByRange<T extends { created_at: string }>(
  logs: T[],
  range: HealthAnalyticsRange
): T[] {
  const days = RANGE_DAYS[range];
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);
  return logs.filter((log) => {
    const t = new Date(log.created_at).getTime();
    return t >= start.getTime() && t <= end.getTime();
  });
}

export type HealthAnalyticsRangeOrNone = HealthAnalyticsRange | null;

export function useHealthAnalytics(range: HealthAnalyticsRangeOrNone = '7d') {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ['health-logs', userId],
    queryFn: () => fetchHealthLogsForPatient(userId),
    enabled: !!userId,
  });

  const data = useMemo(() => {
    if (range === null) return logs;
    return filterLogsByRange(logs, range);
  }, [logs, range]);
  const isEmpty = data.length === 0;

  return {
    data,
    logs: data,
    isLoading,
    error,
    isEmpty,
    userId,
  };
}
