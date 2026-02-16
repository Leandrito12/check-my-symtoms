/**
 * Revocar acceso de un médico al historial del paciente.
 * POST /functions/v1/revoke-access con JWT del paciente.
 * Plan Historial Compartido con el Médico.
 */

import { supabase } from '@/src/infrastructure/supabase';

const EDGE_FUNCTION_NAME = 'revoke-access';

export interface RevokeAccessRequest {
  doctor_id: string;
}

export async function revokeAccess(
  payload: RevokeAccessRequest
): Promise<void> {
  const { error } = await supabase.functions.invoke(EDGE_FUNCTION_NAME, {
    body: payload,
  });
  if (error) {
    const err = error as { message?: string };
    throw new Error(
      err.message ?? 'No se pudo revocar el acceso. Comprueba tu conexión.'
    );
  }
}
