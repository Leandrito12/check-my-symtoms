import { supabase } from '@/src/infrastructure/supabase';
import type { HealthLogDetails } from '@/src/domain/HealthLog';

export interface HealthLogForPatient {
  id: string;
  symptom_id: string | null;
  symptom_name: string;
  secondary_symptom_ids: string[];
  pain_level: number | null;
  created_at: string;
  context: string | null;
  /** C01: Presión solo como details.pressure. Compatibilidad: si backend aún devuelve blood_pressure, el mapper puede rellenar details desde él hasta que migre. */
  details?: HealthLogDetails | null;
  heart_rate: number | null;
  oxygen_saturation: number | null;
}

/**
 * Listar registros de salud del paciente actual. Requiere sesión.
 * Usado en Inicio, detalle y Dashboard (gráficos presión/FC).
 */
export async function fetchHealthLogsForPatient(
  userId: string
): Promise<HealthLogForPatient[]> {
  const { data, error } = await supabase
    .from('health_logs')
    .select('id, symptom_id, secondary_symptom_ids, pain_level, created_at, context, details, blood_pressure, heart_rate, oxygen_saturation, symptoms_master(name)')
    .eq('patient_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as Array<{
    id: string;
    symptom_id: string | null;
    secondary_symptom_ids?: string[] | null;
    pain_level: number | null;
    created_at: string;
    context: string | null;
    details?: HealthLogDetails | null;
    blood_pressure?: string | null;
    heart_rate: number | null;
    oxygen_saturation: number | null;
    symptoms_master: { name: string } | { name: string }[] | null;
  }>;

  return rows.map((r) => {
    const master = r.symptoms_master;
    const name = Array.isArray(master) ? master[0]?.name : master?.name;
    const fromDetails = normalizeDetails(r.details);
    const fromLegacy = parseLegacyBloodPressure(r.blood_pressure);
    const details = fromDetails ?? fromLegacy;
    return {
      id: r.id,
      symptom_id: r.symptom_id,
      symptom_name: name ?? 'Síntoma',
      secondary_symptom_ids: Array.isArray(r.secondary_symptom_ids) ? r.secondary_symptom_ids : [],
      pain_level: r.pain_level,
      created_at: r.created_at,
      context: r.context,
      details: details ?? null,
      heart_rate: r.heart_rate ?? null,
      oxygen_saturation: r.oxygen_saturation ?? null,
    };
  });
}

function parseLegacyBloodPressure(bp: string | null | undefined): HealthLogDetails | null {
  if (!bp?.trim()) return null;
  const parts = bp.split('/').map((s) => parseInt(s.trim(), 10));
  if (parts.length < 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return null;
  return { pressure: { systolic: parts[0], diastolic: parts[1] } };
}

function toNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeDetails(d: HealthLogDetails | null | undefined): HealthLogDetails | null {
  if (!d?.pressure) return null;
  const s = toNumber(d.pressure.systolic);
  const di = toNumber(d.pressure.diastolic);
  if (s == null || di == null) return null;
  return { pressure: { systolic: s, diastolic: di } };
}
