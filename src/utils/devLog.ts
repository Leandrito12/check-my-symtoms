/**
 * Logs solo en desarrollo. Útiles para depurar auth, Supabase, etc.
 * Se ven en la terminal donde corre `npx expo start` y en la consola al depurar (shake → Debug Remote JS).
 */
const PREFIX = '[CheckMySymptoms]';

export function devLog(category: string, message: string, data?: unknown) {
  if (!__DEV__) return;
  const line = `${PREFIX} [${category}] ${message}`;
  if (data !== undefined) {
    console.log(line, data);
  } else {
    console.log(line);
  }
}

export function devWarn(category: string, message: string, data?: unknown) {
  if (!__DEV__) return;
  const line = `${PREFIX} [${category}] ⚠ ${message}`;
  if (data !== undefined) {
    console.warn(line, data);
  } else {
    console.warn(line);
  }
}

/** Oculta la parte media de una URL para no loguear keys completas. */
export function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname;
    if (host === 'placeholder.supabase.co') return 'placeholder.supabase.co (¡configura .env!)';
    if (host.endsWith('.supabase.co')) return `${host.slice(0, 8)}…supabase.co`;
    return host;
  } catch {
    return '(url inválida)';
  }
}
