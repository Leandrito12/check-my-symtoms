/**
 * Hook: historia clínica del paciente.
 * C02: accessToken para vista médico (sin sesión).
 */
import { useQuery } from '@tanstack/react-query';
import { fetchClinicalHistory } from '@/src/useCases/fetchClinicalHistory';

const STALE_TIME_MS = 5 * 60 * 1000;

export function useClinicalHistory(
  patientId: string,
  accessToken?: string | null
) {
  return useQuery({
    queryKey: ['clinical-history', patientId, accessToken ?? 'session'],
    queryFn: () =>
      fetchClinicalHistory(patientId, {
        accessToken: accessToken ?? undefined,
      }),
    enabled: !!patientId,
    staleTime: STALE_TIME_MS,
  });
}
