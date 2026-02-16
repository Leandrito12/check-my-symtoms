/**
 * Domain types – entidades y contratos de salud.
 * Clean Architecture: capa Domain.
 * Pain level 0–10; urgencia en backend ≥ 8 (C03).
 */

export type PainLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface SymptomMaster {
  id: string;
  name: string;
}

/** Payload mínimo para creación; presión solo como details.pressure (C01). */
export interface HealthLogEntry {
  symptom_id?: string;
  pain_level?: number;
  context?: string;
  details?: { pressure?: { systolic: number; diastolic: number }; notes?: string };
  heart_rate?: number;
  oxygen_saturation?: number;
  image_path?: string;
}
