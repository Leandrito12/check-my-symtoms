import { supabase } from '@/src/infrastructure/supabase';

export interface CreateHealthLogPayload {
  patient_id: string;
  symptom_id?: string | null;
  /** UUIDs de sub-síntomas ("Otro síntoma"); deben existir en symptoms_master. */
  secondary_symptom_ids?: string[] | null;
  pain_level?: number | null;
  context?: string | null;
  blood_pressure?: string | null;
  heart_rate?: number | null;
  oxygen_saturation?: number | null;
  image_path?: string | null;
}

export interface CreateHealthLogResult {
  id: string;
  created_at: string;
}

/**
 * Insert en health_logs tras validar con process-health-log (emergency: false).
 * RLS exige patient_id = usuario actual. Ver backend docs swagger sección 6.
 */
export async function createHealthLog(payload: CreateHealthLogPayload): Promise<CreateHealthLogResult> {
  const { data, error } = await supabase
    .from('health_logs')
    .insert({
      patient_id: payload.patient_id,
      symptom_id: payload.symptom_id ?? null,
      secondary_symptom_ids: payload.secondary_symptom_ids ?? [],
      pain_level: payload.pain_level ?? null,
      context: payload.context ?? null,
      blood_pressure: payload.blood_pressure ?? null,
      heart_rate: payload.heart_rate ?? null,
      oxygen_saturation: payload.oxygen_saturation ?? null,
      image_path: payload.image_path ?? null,
    })
    .select('id, created_at')
    .single();
  if (error) throw error;
  return data as CreateHealthLogResult;
}
