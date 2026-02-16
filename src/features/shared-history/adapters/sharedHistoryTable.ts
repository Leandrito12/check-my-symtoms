/**
 * Adapter: SharedHistoryLog → fila de tabla y formateadores.
 * Plan P5: estación de trabajo médico (tabla desktop + export PDF).
 */
import type { SharedHistoryLog } from '@/src/useCases/fetchSharedHistory';
import { computeMap } from '@/src/features/health-dashboard/utils';
import { parsePressureInput } from '@/src/utils/parsePressure';

export const TABLE_COLUMNS = [
  'date',
  'status',
  'symptom',
  'pain',
  'pressure',
  'vitals',
  'context',
  'note',
  'actions',
] as const;

export type TableColumnId = (typeof TABLE_COLUMNS)[number];

export interface PressureValue {
  systolic: number;
  diastolic: number;
  map: number;
}

/** Obtiene presión (systolic, diastolic, map) desde log. MAP = (S + 2D) / 3. */
export function getPressureFromLog(
  log: SharedHistoryLog
): PressureValue | null {
  const sys = log.details?.pressure?.systolic ?? null;
  const dia = log.details?.pressure?.diastolic ?? null;
  if (typeof sys === 'number' && typeof dia === 'number') {
    return {
      systolic: sys,
      diastolic: dia,
      map: computeMap(sys, dia),
    };
  }
  const parsed = log.blood_pressure
    ? parsePressureInput(String(log.blood_pressure))
    : null;
  if (parsed) {
    return {
      systolic: parsed.systolic,
      diastolic: parsed.diastolic,
      map: computeMap(parsed.systolic, parsed.diastolic),
    };
  }
  return null;
}

export function formatDateTime(createdAt: string): string {
  return new Date(createdAt).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export type PainLevelColor = 'green' | 'orange' | 'red';

/** 1–3 verde, 4–7 naranja, 8–10 rojo. */
export function getPainLevelColor(painLevel: number | null | undefined): PainLevelColor {
  if (painLevel == null) return 'green';
  if (painLevel >= 8) return 'red';
  if (painLevel >= 4) return 'orange';
  return 'green';
}

export interface SharedHistoryTableRow {
  id: string;
  log: SharedHistoryLog;
  dateTime: string;
  isEmergency: boolean;
  symptomPrimary: string;
  symptomSecondary: string;
  painLevel: number | null;
  painColor: PainLevelColor;
  pressure: PressureValue | null;
  heartRate: number | null;
  oxygenSaturation: number | null;
  contextSnippet: string | null;
  hasNote: boolean;
  noteReviewed?: boolean;
}

export function mapLogToTableRow(log: SharedHistoryLog): SharedHistoryTableRow {
  const pressure = getPressureFromLog(log);
  const painLevel = log.pain_level ?? null;
  const context = log.context?.trim() ?? null;
  const snippet = context ? (context.length > 50 ? context.slice(0, 50) + '…' : context) : null;
  const isReviewed = Boolean(log.is_reviewed);
  const hasNoteFromRecord = log.clinical_record != null && typeof log.clinical_record === 'object';
  const hasNote = isReviewed || hasNoteFromRecord;
  const noteReviewed = isReviewed;

  return {
    id: log.id,
    log,
    dateTime: formatDateTime(log.created_at),
    isEmergency: Boolean(log.emergency) || (painLevel != null && painLevel >= 8),
    symptomPrimary: log.primary_symptom_name ?? log.symptom_name ?? '—',
    symptomSecondary: (log.secondary_symptoms ?? []).join(', ') || '',
    painLevel,
    painColor: getPainLevelColor(painLevel),
    pressure,
    heartRate: log.heart_rate ?? null,
    oxygenSaturation: log.oxygen_saturation ?? null,
    contextSnippet: snippet,
    hasNote,
    noteReviewed,
  };
}

export function applyFilters(
  logs: SharedHistoryLog[],
  filterEmergencyOnly: boolean,
  filterSymptomSearch: string
): SharedHistoryLog[] {
  let result = logs;
  if (filterEmergencyOnly) {
    result = result.filter(
      (l) => Boolean(l.emergency) || (l.pain_level != null && l.pain_level >= 8)
    );
  }
  const search = filterSymptomSearch.trim().toLowerCase();
  if (search) {
    result = result.filter((l) => {
      const primary = (l.primary_symptom_name ?? l.symptom_name ?? '').toLowerCase();
      const secondary = (l.secondary_symptoms ?? []).join(' ').toLowerCase();
      const context = (l.context ?? '').toLowerCase();
      return primary.includes(search) || secondary.includes(search) || context.includes(search);
    });
  }
  return result;
}
