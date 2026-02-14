import { supabase } from '@/src/infrastructure/supabase';
import type { ProcessHealthLogRequest, ProcessHealthLogResponse } from '@/src/domain/api';

const EDGE_FUNCTION_NAME = 'process-health-log';

/**
 * Valida signos vitales antes de guardar. Devuelve si hay urgencia (dolor ≥ 8 o saturación < 90).
 * No escribe en base de datos. Ver docs/swagger.md – process-health-log.
 * La Edge Function exige Bearer JWT del usuario; el SDK añade el header si hay sesión.
 */
export async function processHealthLog(
  data: ProcessHealthLogRequest
): Promise<ProcessHealthLogResponse> {
  if (__DEV__) {
    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
    const url = `${baseUrl}/functions/v1/${EDGE_FUNCTION_NAME}`;
    console.log('[processHealthLog] Request:', { method: 'POST', url, body: data });
  }

  const { data: result, error } = await supabase.functions.invoke<ProcessHealthLogResponse>(
    EDGE_FUNCTION_NAME,
    { body: data }
  );
  if (error) {
    const err = error as { context?: { status?: number; body?: unknown }; message?: string };
    const status = err.context?.status;
    console.warn(
      '[processHealthLog] Status:',
      status,
      'Body:',
      err.context?.body,
      'Message:',
      err.message
    );
    if (status === 401) {
      console.warn(
        '[processHealthLog] 401 = falta Authorization o token inválido/expirado. La función valida el JWT; el usuario debe estar logueado.'
      );
    }
    const msg =
      error.message?.includes('non-2xx') || error.message?.includes('Edge Function')
        ? 'No se pudo validar el síntoma. Comprueba tu conexión o que la función process-health-log esté desplegada en Supabase.'
        : error.message ?? 'Error al validar el síntoma.';
    throw new Error(msg);
  }
  if (!result) return { emergency: false, reason: null, message: null };
  return result;
}
