/**
 * Use cases – lógica de aplicación (registro de síntomas, validación).
 * Clean Architecture: capa Use Cases.
 */

export { processHealthLog } from './processHealthLog';
export { fetchSymptoms } from './fetchSymptoms';
export { createSymptom } from './createSymptom';
export { createHealthLog } from './createHealthLog';
export type { CreateHealthLogPayload, CreateHealthLogResult } from './createHealthLog';
export { compressImageForSymptom } from './compressImageForSymptom';
export { uploadSymptomPhoto } from './uploadSymptomPhoto';
export { updateHealthLogImagePath } from './updateHealthLogImagePath';
