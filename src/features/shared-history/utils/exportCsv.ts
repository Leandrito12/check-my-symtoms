/**
 * Genera CSV del historial filtrado (mismo orden que la tabla). Plan P6-5.
 */
import type { SharedHistoryLog } from '@/src/useCases/fetchSharedHistory';
import { getPressureFromLog } from '../adapters/sharedHistoryTable';

function escapeCsvCell(value: string): string {
  const s = String(value ?? '');
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsvFromLogs(logs: SharedHistoryLog[]): string {
  const header = [
    'Fecha',
    'Estado',
    'Síntoma principal',
    'Síntomas secundarios',
    'Dolor',
    'Sistólica',
    'Diastólica',
    'MAP',
    'FC (lpm)',
    'Sat O2 (%)',
    'Comentario',
  ].map(escapeCsvCell).join(',');

  const rows = logs.map((log) => {
    const pressure = getPressureFromLog(log);
    const isEmergency = Boolean(log.emergency) || (log.pain_level != null && log.pain_level >= 8);
    const primary = log.primary_symptom_name ?? log.symptom_name ?? '';
    const secondary = (log.secondary_symptoms ?? []).join('; ');
    const dateStr = new Date(log.created_at).toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    const cells = [
      dateStr,
      isEmergency ? 'Urgencia' : 'Normal',
      primary,
      secondary,
      log.pain_level ?? '',
      pressure?.systolic ?? '',
      pressure?.diastolic ?? '',
      pressure?.map ?? '',
      log.heart_rate ?? '',
      log.oxygen_saturation ?? '',
      (log.context ?? '').replace(/\r?\n/g, ' '),
    ].map((v) => escapeCsvCell(String(v)));
    return cells.join(',');
  });

  return [header, ...rows].join('\n');
}
