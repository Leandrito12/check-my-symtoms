/**
 * Strategy Pattern: evaluación del dolor.
 * C03: Umbral ≥ 8 para coincidir con la Edge Function process-health-log (Swagger).
 */

import type { PainLevel } from './types';

const EMERGENCY_THRESHOLD = 8;

export function shouldShowEmergencyAlert(painLevel: PainLevel): boolean {
  return painLevel >= EMERGENCY_THRESHOLD;
}
