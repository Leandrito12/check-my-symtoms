/**
 * Caso de uso: crear/gestionar nota clínica vía Edge Function.
 * C02: Incluir access_token en payload cuando sea contexto médico.
 */
import { manageClinicalRecord as manageFromInfra } from '@/src/infrastructure/clinicalRecords';
import type { ManageClinicalRecordRequest } from '@/src/domain/api';

export async function manageClinicalRecord(
  payload: ManageClinicalRecordRequest
): Promise<{ id: string; created_at: string }> {
  return manageFromInfra(payload);
}
