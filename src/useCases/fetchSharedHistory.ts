/**
 * Obtener historial compartido para la vista del médico.
 * GET /functions/v1/shared-history?access_token=...&from_date=...&to_date=...&limit=...
 * Ver FRONTEND_HANDS_ON_ENDPOINTS.md (backend).
 */

const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export type SharedHistoryRange = '7d' | '30d' | '90d';

export interface SharedHistoryPatientInfo {
  name: string;
  age?: number;
  id?: string;
}

/** Respuesta: period, count, avg_pain_level, avg_map (backend). Compatible con date/systolic/diastolic si el backend lo envía. */
export interface SharedHistoryAnalyticsHistoryItem {
  period?: string;
  date?: string;
  count?: number;
  avg_pain_level?: number;
  avg_map?: number;
  systolic?: number;
  diastolic?: number;
  map?: number;
  heart_rate?: number;
}

export interface SharedHistoryMetadata {
  expires_at?: string;
  doctor_name?: string;
}

export interface SharedHistoryAnalytics {
  history?: SharedHistoryAnalyticsHistoryItem[];
  symptom_frequency?: Record<string, number> | Array<{ symptom_name: string; count: number }>;
  anomaly?: boolean;
}

export interface SharedHistoryLog {
  id: string;
  patient_id?: string;
  created_at: string;
  symptom_id?: string | null;
  symptom_name?: string;
  primary_symptom_name?: string;
  secondary_symptoms?: string[];
  secondary_symptom_ids?: string[];
  pain_level?: number | null;
  context?: string | null;
  blood_pressure?: string | null;
  details?: { pressure?: { systolic?: number; diastolic?: number } } | null;
  heart_rate?: number | null;
  oxygen_saturation?: number | null;
  emergency?: boolean;
  /** Backend: true cuando el médico ya asoció una nota clínica a este log. */
  is_reviewed?: boolean;
  image_path?: string | null;
  /** Compatibilidad: si el backend envía objeto de nota en lugar de is_reviewed. */
  clinical_record?: unknown;
}

export interface SharedHistoryResponse {
  patient_info: SharedHistoryPatientInfo;
  metadata?: SharedHistoryMetadata;
  analytics: SharedHistoryAnalytics;
  logs: SharedHistoryLog[];
  total?: number;
  limit?: number;
  offset?: number;
  /** Compatibilidad: algunos backends devuelven en raíz. */
  expires_at?: string;
  expires_in_seconds?: number;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function fetchSharedHistory(
  accessToken: string,
  range: SharedHistoryRange = '7d'
): Promise<SharedHistoryResponse> {
  const toDate = new Date();
  const fromDate = new Date();
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  fromDate.setDate(fromDate.getDate() - days);

  const params = new URLSearchParams({
    access_token: accessToken,
    from_date: toISODate(fromDate),
    to_date: toISODate(toDate),
    limit: '500',
  });
  const url = `${baseUrl}/functions/v1/shared-history?${params.toString()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      apikey: anonKey,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { error?: string }).error ?? `shared-history: ${res.status}`;
    const e = new Error(msg) as Error & { status?: number };
    e.status = res.status;
    throw e;
  }
  const data = (await res.json()) as SharedHistoryResponse;
  if (data.metadata?.expires_at && !data.expires_at) {
    data.expires_at = data.metadata.expires_at;
    const expiresAt = new Date(data.metadata.expires_at).getTime();
    data.expires_in_seconds = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
  }
  return data;
}
