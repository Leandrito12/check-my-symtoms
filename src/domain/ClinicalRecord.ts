/**
 * Entidad ClinicalRecord y DTO de creación.
 * Clean Architecture: capa Domain.
 */

export type ClinicalRecordType =
  | 'evolucion'
  | 'estudio'
  | 'diagnostico'
  | 'medicacion';

export interface ClinicalRecord {
  id: string;
  patient_id: string;
  doctor_name: string;
  note_content: string;
  record_type: ClinicalRecordType;
  tags: string[];
  is_urgent: boolean;
  created_at: string;
}

export interface CreateClinicalRecordDTO {
  patient_id: string;
  doctor_name: string;
  content: string;
  record_type: ClinicalRecordType;
  tags: string[];
  is_urgent: boolean;
}
