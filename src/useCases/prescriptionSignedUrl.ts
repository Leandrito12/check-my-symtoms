import { supabase } from '@/src/infrastructure/supabase';

const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

export interface PrescriptionSignedUrlPayload {
  log_id: string;
  comment_id?: string;
  attachment_path?: string;
}

export interface PrescriptionSignedUrlResponse {
  url: string;
  expiresIn: number;
}

/**
 * Obtener URL temporal (24 h) para ver/descargar prescripción. Requiere JWT (paciente dueño del log).
 * Ver docs/swagger.md sección 4.
 */
export async function prescriptionSignedUrl(
  payload: PrescriptionSignedUrlPayload
): Promise<PrescriptionSignedUrlResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Debes iniciar sesión para ver la receta.');

  const url = `${baseUrl}/functions/v1/prescription-signed-url`;
  const body: Record<string, string> = { log_id: payload.log_id };
  if (payload.comment_id) body.comment_id = payload.comment_id;
  else if (payload.attachment_path) body.attachment_path = payload.attachment_path;
  else throw new Error('Indica comment_id o attachment_path.');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `prescription-signed-url: ${res.status}`);
  }
  return res.json() as Promise<PrescriptionSignedUrlResponse>;
}
