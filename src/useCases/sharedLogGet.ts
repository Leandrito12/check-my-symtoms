import type { SharedLogGetResponse } from '@/src/domain/api';
import { supabase } from '@/src/infrastructure/supabase';

const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

async function fetchSharedLog(logId: string, bearer: string): Promise<SharedLogGetResponse> {
  const url = `${baseUrl}/functions/v1/shared-log?id=${encodeURIComponent(logId)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${bearer}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error((err as { error?: string }).error ?? `shared-log: ${res.status}`), { status: res.status });
  }
  return res.json() as Promise<SharedLogGetResponse>;
}

/**
 * Obtener log y comentarios (vista paciente o compartida).
 * El backend shared-log GET lee id/log_id solo desde la query string (url.searchParams), no desde el body.
 * Refrescamos la sesión antes de usar el token para evitar enviar un JWT expirado; si recibimos 401, intentamos un refresco y un reintento.
 * Ver docs/swagger.md sección 2.
 */
export async function sharedLogGet(logId: string): Promise<SharedLogGetResponse> {
  await supabase.auth.refreshSession();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (__DEV__ && sessionError) {
    console.error('[sharedLogGet] Error obteniendo sesión:', sessionError);
  }

  let bearer = session?.access_token ?? anonKey;

  try {
    return await fetchSharedLog(logId, bearer);
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status === 401 && session?.access_token) {
      await supabase.auth.refreshSession();
      const { data: { session: newSession } } = await supabase.auth.getSession();
      const newBearer = newSession?.access_token ?? anonKey;
      return fetchSharedLog(logId, newBearer);
    }
    throw e;
  }
}
