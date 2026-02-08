/**
 * Domain types – entidades y contratos de salud.
 * Clean Architecture: capa Domain.
 */

export type PainLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface SymptomMaster {
  id: string;
  name: string;
}

export interface HealthLogEntry {
  symptom_id?: string;
  pain_level?: number;
  context?: string;
  blood_pressure?: string;
  heart_rate?: number;
  oxygen_saturation?: number;
  image_path?: string;
}
