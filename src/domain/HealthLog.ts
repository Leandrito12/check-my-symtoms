/**
 * Entidad HealthLog y presión arterial.
 * Clean Architecture: capa Domain.
 * C01: Single source of truth – solo objeto details.pressure, sin string "120/80".
 */

export interface BloodPressure {
  systolic: number;
  diastolic: number;
}

export interface HealthLogDetails {
  pressure?: BloodPressure;
  notes?: string;
}

export interface HealthLog {
  id: string;
  symptom_id: string;
  pain_level: number; // 0–10
  details?: HealthLogDetails;
  created_at: string;
}
