import { supabase } from '@/src/infrastructure/supabase';

const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export interface SharedBundleLog {
  id: string;
  symptom_name: string;
  pain_level: number | null;
  context: string | null;
  blood_pressure: string | null;
  heart_rate: number | null;
  oxygen_saturation: number | null;
  created_at: string;
}

export interface SharedBundleResponse {
  range: { from_date: string; to_date: string };
  logs: SharedBundleLog[];
}

/**
 * Vista del médico: trae los registros de un bundle por su token. Público (sin login).
 * Edge function: shared-bundle (GET ?token). Si hay sesión, manda el JWT; si no, anonKey.
 */
export async function fetchSharedBundle(token: string): Promise<SharedBundleResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  const bearer = session?.access_token ?? anonKey;
  const url = `${baseUrl}/functions/v1/shared-bundle?token=${encodeURIComponent(token)}`;
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
    throw Object.assign(
      new Error((err as { error?: string }).error ?? `shared-bundle: ${res.status}`),
      { status: res.status }
    );
  }
  return res.json() as Promise<SharedBundleResponse>;
}
