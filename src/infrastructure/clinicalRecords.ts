/**
 * Infrastructure: clinical_records (lectura) y Edge Function manage-clinical-record.
 * C02: accessToken para contexto médico sin sesión.
 */

import { supabase } from './supabase';
import type { ClinicalRecord } from '@/src/domain/ClinicalRecord';
import type { ManageClinicalRecordRequest } from '@/src/domain/api';

const EDGE_FUNCTION_NAME = 'manage-clinical-record';

/**
 * Lee historia clínica del paciente. Con sesión (patient_id = auth.uid()) usa RLS.
 * Para médico sin sesión debe usarse una Edge Function que acepte access_token; esta función
 * es para el paciente logueado. Si se necesita lectura por médico, añadir invoke con accessToken.
 */
export async function fetchClinicalHistoryFromDb(
  patientId: string
): Promise<ClinicalRecord[]> {
  const { data, error } = await supabase
    .from('clinical_records')
    .select('id, patient_id, doctor_name, note_content, record_type, tags, is_urgent, created_at')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ClinicalRecord[];
}

export interface FetchClinicalHistoryOptions {
  accessToken?: string | null;
}

/**
 * Fetch historia clínica. Si hay accessToken (médico), invoca Edge Function que devuelve lista.
 * Sin token, usa fetchClinicalHistoryFromDb (paciente logueado).
 */
export async function fetchClinicalHistory(
  patientId: string,
  options?: FetchClinicalHistoryOptions
): Promise<ClinicalRecord[]> {
  if (options?.accessToken) {
    const { data, error } = await supabase.functions.invoke<ClinicalRecord[]>(
      'get-clinical-history',
      {
        body: { patient_id: patientId, access_token: options.accessToken },
      }
    );
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  }
  return fetchClinicalHistoryFromDb(patientId);
}

/** Backend espera record_type: nota | estudio | diagnóstico | medicamento (FRONTEND_HANDS_ON_ENDPOINTS.md). */
const RECORD_TYPE_TO_BACKEND: Record<
  ManageClinicalRecordRequest['record_type'],
  string
> = {
  evolucion: 'nota',
  estudio: 'estudio',
  diagnostico: 'diagnóstico',
  medicacion: 'medicamento',
};

/**
 * Crea o gestiona nota clínica vía Edge Function. Incluir access_token en body cuando sea médico (C02).
 * Mapea content → note_content y record_type al valor que espera el backend.
 */
export async function manageClinicalRecord(
  payload: ManageClinicalRecordRequest
): Promise<{ id: string; created_at: string }> {
  const body = {
    access_token: payload.access_token,
    patient_id: payload.patient_id,
    note_content: payload.content,
    record_type: RECORD_TYPE_TO_BACKEND[payload.record_type],
    log_id: payload.log_id,
    tags: payload.tags ?? [],
    metadata: {},
  };
  const { data, error } = await supabase.functions.invoke<{
    record?: { id: string; created_at: string };
    id?: string;
    created_at?: string;
  }>(EDGE_FUNCTION_NAME, { body });
  if (error) throw error;
  const record = data?.record ?? data;
  const id = record?.id ?? data?.id;
  const created_at = record?.created_at ?? data?.created_at;
  if (!id) throw new Error('manage-clinical-record no devolvió id');
  return { id, created_at: created_at ?? new Date().toISOString() };
}
