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
