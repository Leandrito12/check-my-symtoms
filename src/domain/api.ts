/**
 * Contratos de API (Edge Functions) – según docs/swagger.md
 */

export interface ProcessHealthLogRequest {
  symptom_id?: string;
  pain_level?: number;
  context?: string;
  blood_pressure?: string;
  heart_rate?: number;
  oxygen_saturation?: number;
}

export interface ProcessHealthLogResponse {
  emergency: boolean;
  reason: string | null;
  message: string | null;
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
