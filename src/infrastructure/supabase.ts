import { createClient, processLock } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { devLog, devWarn, maskUrl } from '@/src/utils/devLog';

/**
 * Cliente único de Supabase. Debe crearse con URL y clave pública del proyecto.
 * Clave: Dashboard → Settings → API → Publishable key (o anon si usas Legacy API keys).
 * Para process-health-log el SDK envía el JWT del usuario si hay sesión; la Edge Function valida el token.
 * Si faltan variables de entorno, se usan placeholders para que la app arranque (las peticiones fallarán hasta configurar .env).
 * En React Native: storage (AsyncStorage) y lock (processLock) mejoran persistencia y evitan bloqueos en setSession (Hermes).
 */
const supabaseUrl =
  (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim() || 'https://placeholder.supabase.co';
const supabaseAnonKey =
  (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '').trim() ||
  'placeholder-anon-key';

const isConfigured =
  process.env.EXPO_PUBLIC_SUPABASE_URL &&
  (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_KEY);

if (__DEV__) {
  if (!isConfigured) {
    devWarn(
      'Supabase',
      'EXPO_PUBLIC_SUPABASE_URL y/o EXPO_PUBLIC_SUPABASE_ANON_KEY vacías. OAuth redirigirá a placeholder.supabase.co. Copia .env.example → .env, rellena valores y reinicia: npx expo start --clear'
    );
  }
  devLog('Supabase', 'URL en uso: ' + maskUrl(supabaseUrl));
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage, lock: processLock } : {}),
  },
});

const SET_SESSION_TIMEOUT_MS = 12_000;

/**
 * setSession con timeout para evitar bloqueos indefinidos en Hermes (Web Locks).
 * Mitiga el cuelgue conocido que puede provocar IOException al volver de OAuth.
 */
export async function setSessionWithTimeout(tokens: {
  access_token: string;
  refresh_token: string;
}) {
  const result = await Promise.race([
    supabase.auth.setSession(tokens),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('setSession timeout')), SET_SESSION_TIMEOUT_MS)
    ),
  ]);
  return result;
}

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
