/**
 * Combina logs de salud y notas clínicas para gráficos con anotaciones.
 * Fase 8: datos correlacionados (mismo día UTC).
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchHealthLogsForPatient } from '@/src/useCases';
import { fetchClinicalHistory } from '@/src/infrastructure/clinicalRecords';
import type { HealthLogForPatient } from '@/src/useCases/fetchHealthLogsForPatient';
import type { ClinicalRecord } from '@/src/domain/ClinicalRecord';

export interface CorrelatedPoint {
  timestamp: number;
  date: string;
  value: number | null;
  event: { type: string; content: string } | null;
}

function isSameDayUTC(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function useCorrelatedData(
  patientId: string,
  symptomId: string | null,
  accessToken?: string | null
): CorrelatedPoint[] {
  const { data: logs = [] } = useQuery({
    queryKey: ['health-logs', patientId],
    queryFn: () => fetchHealthLogsForPatient(patientId),
    enabled: !!patientId,
  });
  const { data: notes = [] } = useQuery({
    queryKey: ['clinical-history', patientId, accessToken ?? 'session'],
    queryFn: () =>
      fetchClinicalHistory(patientId, { accessToken: accessToken ?? undefined }),
    enabled: !!patientId,
  });

  return useMemo(() => {
    const filtered = symptomId
      ? logs.filter((l) => l.symptom_id === symptomId)
      : logs;
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return sorted.map((log) => {
      const logDate = new Date(log.created_at);
      const noteOnDay = notes.find((n) =>
        isSameDayUTC(new Date(n.created_at), logDate)
      );
      const value =
        log.details?.pressure?.systolic ?? log.heart_rate ?? null;
      return {
        timestamp: logDate.getTime(),
        date: log.created_at,
        value: value ?? null,
        event: noteOnDay
          ? { type: noteOnDay.record_type, content: noteOnDay.note_content }
          : null,
      };
    });
  }, [logs, notes, symptomId]);
}
