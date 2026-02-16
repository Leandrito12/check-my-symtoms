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
export { getPatientAnalytics } from './getPatientAnalytics';
export { fetchClinicalHistory } from './fetchClinicalHistory';
export { manageClinicalRecord } from './manageClinicalRecord';
export { grantAccess } from './grantAccess';
export type { GrantAccessRequest, GrantAccessResponse } from './grantAccess';
export { revokeAccess } from './revokeAccess';
export type { RevokeAccessRequest } from './revokeAccess';
export { fetchAccessRequests } from './fetchAccessRequests';
export type { AccessRequestsResponse, PendingRequest, AuthorizedDoctor } from './fetchAccessRequests';
export { fetchSharedHistory } from './fetchSharedHistory';
export type {
  SharedHistoryResponse,
  SharedHistoryRange,
  SharedHistoryPatientInfo,
  SharedHistoryAnalytics,
  SharedHistoryLog,
} from './fetchSharedHistory';
export { requestAccess } from './requestAccess';
export type { RequestAccessPayload, RequestAccessResponse } from './requestAccess';
