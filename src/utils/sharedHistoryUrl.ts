/**
 * Utilidad para generar la URL compartible que el paciente envía al médico
 * tras conceder acceso (grant-access). Plan Historial Compartido con el Médico.
 */

const DEFAULT_BASE = process.env.EXPO_PUBLIC_APP_URL ?? '';

/**
 * Construye la URL del portal del médico para solicitar acceso (con código opcional en query).
 * Uso: el paciente comparte este enlace para que el médico abra la pantalla y tenga el código pre-rellenado.
 */
export function buildDoctorRequestUrl(shareCode: string, baseUrl?: string): string {
  const base = (baseUrl ?? DEFAULT_BASE).replace(/\/$/, '');
  const code = encodeURIComponent(shareCode);
  return `${base}/doctor/request?code=${code}`;
}

/**
 * Construye la URL del historial compartido con el token en query.
 * Uso: tras grant-access, el paciente copia/comparte esta URL con el médico.
 *
 * @param accessToken - Token devuelto por POST grant-access
 * @param baseUrl - Base URL de la app (opcional). En web puede usarse window.location.origin
 * @returns URL completa, ej. https://app.ejemplo.com/shared/history?token=XXXX
 */
export function buildSharedHistoryUrl(accessToken: string, baseUrl?: string): string {
  const base = (baseUrl ?? DEFAULT_BASE).replace(/\/$/, '');
  const path = '/shared/history';
  const token = encodeURIComponent(accessToken);
  return `${base}${path}?token=${token}`;
}
