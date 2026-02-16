/**
 * Conceder acceso a un médico que solicitó historial.
 * POST /functions/v1/grant-access con JWT del paciente.
 * Plan Historial Compartido con el Médico.
 */

import { supabase } from '@/src/infrastructure/supabase';

const EDGE_FUNCTION_NAME = 'grant-access';

export interface GrantAccessRequest {
  request_id: string;
}

export interface GrantAccessResponse {
  success: boolean;
  access_token: string;
}

export async function grantAccess(
  payload: GrantAccessRequest
): Promise<GrantAccessResponse> {
  const { data, error } = await supabase.functions.invoke<GrantAccessResponse>(
    EDGE_FUNCTION_NAME,
    { body: payload }
  );
  if (error) {
    const err = error as { context?: { status?: number; body?: unknown }; message?: string };
    const msg =
      err.message ?? 'No se pudo conceder el acceso. Comprueba tu conexión o que la función esté desplegada.';
    throw new Error(msg);
  }
  if (!data?.access_token) {
    throw new Error('El servidor no devolvió un enlace de acceso.');
  }
  return { success: data.success !== false, access_token: data.access_token };
}
