/**
 * Caso de uso: obtener historia clínica del paciente.
 * C02: Acepta accessToken para vista médico sin sesión.
 */
import { fetchClinicalHistory as fetchFromInfra } from '@/src/infrastructure/clinicalRecords';
import type { ClinicalRecord } from '@/src/domain/ClinicalRecord';

export async function fetchClinicalHistory(
  patientId: string,
  options?: { accessToken?: string | null }
): Promise<ClinicalRecord[]> {
  return fetchFromInfra(patientId, options);
}
