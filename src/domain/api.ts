/**
 * Contratos de API (Edge Functions) – según docs/swagger.md
 * C01: En app y DB solo objeto details.pressure; process-health-log puede seguir recibiendo blood_pressure string (construido en use case).
 */

/** Body para process-health-log. symptom_id obligatorio. blood_pressure: string para la Edge Function (ej. "120/80"); el use case lo construye desde details.pressure. */
export interface ProcessHealthLogRequest {
  symptom_id: string;
  pain_level: number | null;
  context: string;
  blood_pressure: string;
  heart_rate: number | null;
  oxygen_saturation: number | null;
}

/** Respuesta get-patient-analytics (GET, queryParams: symptomId, range). */
export interface PatientAnalyticsPoint {
  date: string;
  value: number;
  secondary?: number;
}

/** Body para manage-clinical-record. access_token en body o headers cuando el médico no tiene sesión (C02). log_id opcional para asociar la nota a un registro del historial (P6). */
export interface ManageClinicalRecordRequest {
  access_token?: string;
  patient_id: string;
  doctor_name: string;
  content: string;
  record_type: 'evolucion' | 'estudio' | 'diagnostico' | 'medicacion';
  tags: string[];
  is_urgent: boolean;
  /** Opcional: id del log de salud al que se asocia esta nota (vista compartida médico). */
  log_id?: string;
}

export interface ProcessHealthLogResponse {
  emergency: boolean;
  reason: string | null;
  message: string | null;
  /** Presión arterial media (MAP), cuando el backend la devuelve tras validar presión. */
  map?: number | null;
}

export interface SharedLogLog {
  id: string;
  patient_id: string;
  symptom_id: string;
  pain_level: number;
  context: string | null;
  blood_pressure: string | null;
  heart_rate: number | null;
  oxygen_saturation: number | null;
  image_path: string | null;
  created_at: string;
  symptom_name: string;
}

export interface SharedLogComment {
  id: string;
  author_name: string;
  content: string;
  attachment_path: string | null;
  created_at: string;
}

export interface SharedLogGetResponse {
  log: SharedLogLog;
  comments: SharedLogComment[];
}
