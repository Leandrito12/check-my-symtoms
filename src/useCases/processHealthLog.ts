import { supabase } from '@/src/infrastructure/supabase';
import type { ProcessHealthLogRequest, ProcessHealthLogResponse } from '@/src/domain/api';

/**
 * Valida signos vitales antes de guardar. Devuelve si hay urgencia (dolor ≥ 8 o saturación < 90).
 * No escribe en base de datos. Ver docs/swagger.md – process-health-log.
 */
export async function processHealthLog(
  data: ProcessHealthLogRequest
): Promise<ProcessHealthLogResponse> {
  const { data: result, error } = await supabase.functions.invoke<ProcessHealthLogResponse>(
    'process-health-log',
    { body: data }
  );
  if (error) throw error;
  if (!result) return { emergency: false, reason: null, message: null };
  return result;
}
