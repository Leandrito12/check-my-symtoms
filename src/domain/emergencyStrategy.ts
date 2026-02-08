/**
 * Strategy Pattern: evaluación del dolor.
 * Si el valor es > 7 (o máximo en escala 0-7), se dispara la Estrategia de Emergencia.
 */

import type { PainLevel } from './types';

const EMERGENCY_THRESHOLD = 7;

export function shouldShowEmergencyAlert(painLevel: PainLevel): boolean {
  return painLevel >= EMERGENCY_THRESHOLD;
}
