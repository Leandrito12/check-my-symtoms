import { supabase } from '@/src/infrastructure/supabase';
import type { HealthLogDetails } from '@/src/domain/HealthLog';

export interface CreateHealthLogPayload {
  patient_id: string;
  symptom_id?: string | null;
  secondary_symptom_ids?: string[] | null;
  pain_level?: number | null;
  context?: string | null;
  /** C01: Preferir details. Si no hay details pero sí blood_pressure (legacy), se convierte a details para el insert. */
  details?: HealthLogDetails | null;
  /** @deprecated Usar details.pressure. Se convierte a details solo para no romper UI hasta Fase 4. */
  blood_pressure?: string | null;
  heart_rate?: number | null;
  oxygen_saturation?: number | null;
  image_path?: string | null;
}

export interface CreateHealthLogResult {
  id: string;
  created_at: string;
}

/** Parsea "120/80" a details.pressure (solo para legacy desde UI hasta Fase 4). */
function legacyBloodPressureToDetails(bp: string | null | undefined): HealthLogDetails | null {
  if (!bp?.trim()) return null;
  const parts = bp.split('/').map((s) => parseInt(s.trim(), 10));
  if (parts.length < 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return null;
  return { pressure: { systolic: parts[0], diastolic: parts[1] } };
}

/**
 * Insert en health_logs. RLS exige patient_id = usuario actual.
 * C01: Envía details (JSONB). Si solo viene blood_pressure (legacy), se convierte a details.
 */
export async function createHealthLog(payload: CreateHealthLogPayload): Promise<CreateHealthLogResult> {
  const details =
    payload.details ?? legacyBloodPressureToDetails(payload.blood_pressure) ?? null;
  const { data, error } = await supabase
    .from('health_logs')
    .insert({
      patient_id: payload.patient_id,
      symptom_id: payload.symptom_id ?? null,
      secondary_symptom_ids: payload.secondary_symptom_ids ?? [],
      pain_level: payload.pain_level ?? null,
      context: payload.context ?? null,
      details,
      heart_rate: payload.heart_rate ?? null,
      oxygen_saturation: payload.oxygen_saturation ?? null,
      image_path: payload.image_path ?? null,
    })
    .select('id, created_at')
    .single();
  if (error) throw error;
  return data as CreateHealthLogResult;
}
