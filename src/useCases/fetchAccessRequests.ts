/**
 * Obtener share_code del paciente, solicitudes pendientes y médicos autorizados.
 * Backend puede exponer GET /access-requests o GET /me con estos datos.
 * Plan Historial Compartido con el Médico.
 */

import { supabase } from '@/src/infrastructure/supabase';

const EDGE_FUNCTION_NAME = 'access-requests';

export interface PendingRequest {
  request_id: string;
  doctor_name: string;
  requested_at?: string;
}

export interface AuthorizedDoctor {
  doctor_id: string;
  doctor_name: string;
  granted_at?: string;
}

export interface AccessRequestsResponse {
  share_code: string | null;
  pending_requests: PendingRequest[];
  authorized_doctors: AuthorizedDoctor[];
}

/**
 * Obtiene share_code, solicitudes pendientes y médicos autorizados.
 * Requiere JWT del paciente. Si el backend no tiene el endpoint, devuelve estructura vacía.
 */
export async function fetchAccessRequests(): Promise<AccessRequestsResponse> {
  try {
    const { data, error } = await supabase.functions.invoke<AccessRequestsResponse>(
      EDGE_FUNCTION_NAME,
      { body: {} }
    );
    if (error) {
      if (__DEV__) {
        console.warn('[fetchAccessRequests] Backend no disponible:', error.message);
      }
      return {
        share_code: null,
        pending_requests: [],
        authorized_doctors: [],
      };
    }
    return {
      share_code: data?.share_code ?? null,
      pending_requests: Array.isArray(data?.pending_requests) ? data.pending_requests : [],
      authorized_doctors: Array.isArray(data?.authorized_doctors) ? data.authorized_doctors : [],
    };
  } catch {
    return {
      share_code: null,
      pending_requests: [],
      authorized_doctors: [],
    };
  }
}
