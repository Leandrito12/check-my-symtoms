import { supabase } from '@/src/infrastructure/supabase';

export interface HealthLogForPatient {
  id: string;
  symptom_id: string | null;
  symptom_name: string;
  pain_level: number | null;
  created_at: string;
  context: string | null;
  blood_pressure: string | null;
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
    .select('id, symptom_id, pain_level, created_at, context, blood_pressure, heart_rate, oxygen_saturation, symptoms_master(name)')
    .eq('patient_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as Array<{
    id: string;
    symptom_id: string | null;
    pain_level: number | null;
    created_at: string;
    context: string | null;
    blood_pressure: string | null;
    heart_rate: number | null;
    oxygen_saturation: number | null;
    symptoms_master: { name: string } | { name: string }[] | null;
  }>;

  return rows.map((r) => {
    const master = r.symptoms_master;
    const name = Array.isArray(master) ? master[0]?.name : master?.name;
    return {
      id: r.id,
      symptom_id: r.symptom_id,
      symptom_name: name ?? 'Síntoma',
      pain_level: r.pain_level,
      created_at: r.created_at,
      context: r.context,
      blood_pressure: r.blood_pressure ?? null,
      heart_rate: r.heart_rate ?? null,
      oxygen_saturation: r.oxygen_saturation ?? null,
    };
  });
}
