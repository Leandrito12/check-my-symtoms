/**
 * Infrastructure: invocación de Edge Function get-patient-analytics.
 * C02: Acepta accessToken opcional para vista médico (sin sesión).
 */

import { supabase } from './supabase';
import type { PatientAnalyticsPoint } from '@/src/domain/api';

const EDGE_FUNCTION_NAME = 'get-patient-analytics';

export interface GetPatientAnalyticsOptions {
  accessToken?: string | null;
}

/**
 * Invoca get-patient-analytics. Parámetros en body (backend puede aceptar GET con queryParams o POST con body).
 * Con accessToken se envía Authorization: Bearer para validar al médico.
 */
export async function getPatientAnalytics(
  symptomId: string,
  range: 'week' | 'month',
  options?: GetPatientAnalyticsOptions
): Promise<PatientAnalyticsPoint[]> {
  const headers: Record<string, string> = {};
  if (options?.accessToken) {
    headers['Authorization'] = `Bearer ${options.accessToken}`;
  }

  const { data, error } = await supabase.functions.invoke<PatientAnalyticsPoint[]>(
    EDGE_FUNCTION_NAME,
    {
      body: { symptomId, range },
      headers: Object.keys(headers).length ? headers : undefined,
    }
  );

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
