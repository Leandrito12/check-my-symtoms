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
export { sharedLogGet } from './sharedLogGet';
export { sharedLogPost } from './sharedLogPost';
export type { SharedLogPostPayload, SharedLogPostResponse } from './sharedLogPost';
export { uploadPrescription } from './uploadPrescription';
export type { UploadPrescriptionPayload, UploadPrescriptionResponse } from './uploadPrescription';
export { prescriptionSignedUrl } from './prescriptionSignedUrl';
export type { PrescriptionSignedUrlPayload, PrescriptionSignedUrlResponse } from './prescriptionSignedUrl';
export { fetchHealthLogsForPatient } from './fetchHealthLogsForPatient';
export type { HealthLogForPatient } from './fetchHealthLogsForPatient';
