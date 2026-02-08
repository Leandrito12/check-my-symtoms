/**
 * URL pública de la vista compartida (médico) para un log.
 * El paciente comparte este enlace para que el médico vea el síntoma y pueda comentar/recetar.
 */
const BASE_URL = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_APP_URL) || '';

export function getSharedViewUrl(logId: string): string {
  const base = BASE_URL.replace(/\/$/, '');
  return base ? `${base}/v/${logId}` : `/v/${logId}`;
}
