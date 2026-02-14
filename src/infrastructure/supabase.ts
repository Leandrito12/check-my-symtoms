import { createClient } from '@supabase/supabase-js';

/**
 * Cliente único de Supabase. Debe crearse con URL y clave pública del proyecto.
 * Clave: Dashboard → Settings → API → Publishable key (o anon si usas Legacy API keys).
 * Para process-health-log el SDK envía el JWT del usuario si hay sesión; la Edge Function valida el token.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';

if (__DEV__) {
  if (!supabaseAnonKey || supabaseAnonKey.length < 10) {
    console.warn(
      '[Supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY (o EXPO_PUBLIC_SUPABASE_KEY) está vacía o muy corta. ' +
        'El gateway responderá 401. Revisa .env y reinicia el bundler: npx expo start --clear'
    );
  }
  if (!supabaseUrl) {
    console.warn('[Supabase] EXPO_PUBLIC_SUPABASE_URL está vacía. Revisa .env.');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
