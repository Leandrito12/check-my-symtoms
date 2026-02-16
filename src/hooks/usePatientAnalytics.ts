/**
 * Hook: analytics de paciente para gráficos.
 * C02: accessToken para vista médico (sin sesión); queryKey incluye token.
 */
import { useQuery } from '@tanstack/react-query';
import { getPatientAnalytics } from '@/src/useCases/getPatientAnalytics';

const STALE_TIME_MS = 5 * 60 * 1000;

export function usePatientAnalytics(
  symptomId: string,
  range: 'week' | 'month',
  accessToken?: string | null
) {
  return useQuery({
    queryKey: ['patient-analytics', symptomId, range, accessToken ?? 'session'],
    queryFn: () =>
      getPatientAnalytics(symptomId, range, {
        accessToken: accessToken ?? undefined,
      }),
    enabled: !!symptomId,
    staleTime: STALE_TIME_MS,
  });
}
