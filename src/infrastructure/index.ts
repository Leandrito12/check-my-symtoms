/**
 * Infrastructure – cliente Supabase y configuración.
 * Clean Architecture: capa Infrastructure.
 */

export { supabase } from './supabase';
export { getPatientAnalytics } from './analytics';
export type { GetPatientAnalyticsOptions } from './analytics';
export {
  fetchClinicalHistory,
  fetchClinicalHistoryFromDb,
  manageClinicalRecord,
} from './clinicalRecords';
export type { FetchClinicalHistoryOptions } from './clinicalRecords';
