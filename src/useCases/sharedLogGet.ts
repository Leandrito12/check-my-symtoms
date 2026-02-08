import type { SharedLogGetResponse } from '@/src/domain/api';

const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Obtener log y comentarios para la vista compartida (médico). No requiere auth.
 * GET /functions/v1/shared-log?id={log_id}. Ver docs/swagger.md.
 */
export async function sharedLogGet(logId: string): Promise<SharedLogGetResponse> {
  const url = `${baseUrl}/functions/v1/shared-log?id=${encodeURIComponent(logId)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      apikey: anonKey,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `shared-log: ${res.status}`);
  }
  return res.json() as Promise<SharedLogGetResponse>;
}
