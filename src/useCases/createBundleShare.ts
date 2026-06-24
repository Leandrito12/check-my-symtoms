import { supabase } from '@/src/infrastructure/supabase';

export interface CreateBundleShareResponse {
  token: string;
  expires_at: string;
}

/**
 * Crea un "bundle" compartible: el backend guarda el rango [from_date, to_date]
 * en shared_bundles y devuelve un token (UUID) para armar el link /b/{token}.
 * Requiere sesión (JWT del paciente). Edge function: create-bundle (POST).
 */
export async function createBundleShare(
  fromDate: Date,
  toDate: Date
): Promise<CreateBundleShareResponse> {
  const { data, error } = await supabase.functions.invoke<CreateBundleShareResponse>(
    'create-bundle',
    { body: { from_date: fromDate.toISOString(), to_date: toDate.toISOString() } }
  );
  if (error) {
    throw new Error(error.message ?? 'No se pudo generar el link para compartir.');
  }
  if (!data?.token) {
    throw new Error('El servidor no devolvió un token de compartido.');
  }
  return data;
}
