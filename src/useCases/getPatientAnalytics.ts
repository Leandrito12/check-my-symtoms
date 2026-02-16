/**
 * Caso de uso: obtener analytics de paciente (gráficos evolución).
 * C02: Acepta accessToken para vista médico sin sesión.
 */
import { getPatientAnalytics as getAnalytics } from '@/src/infrastructure/analytics';

export async function getPatientAnalytics(
  symptomId: string,
  range: 'week' | 'month',
  options?: { accessToken?: string | null }
) {
  return getAnalytics(symptomId, range, options);
}
