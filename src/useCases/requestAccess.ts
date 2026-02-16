/**
 * Solicitar acceso al historial de un paciente (médico).
 * POST /functions/v1/request-access
 * Plan Historial Compartido con el Médico.
 */

const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export interface RequestAccessPayload {
  share_code: string;
  doctor_name: string;
}

export interface RequestAccessResponse {
  status: 'pending';
  request_id: string;
}

export async function requestAccess(
  payload: RequestAccessPayload
): Promise<RequestAccessResponse> {
  const res = await fetch(`${baseUrl}/functions/v1/request-access`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      apikey: anonKey,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { error?: string }).error ?? `request-access: ${res.status}`;
    throw new Error(msg);
  }
  return res.json() as Promise<RequestAccessResponse>;
}
