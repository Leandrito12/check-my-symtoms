const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export interface UploadPrescriptionPayload {
  log_id: string;
  content: string;
  author_name?: string;
  fileUri?: string;
  fileName?: string;
  fileType?: string;
}

export interface UploadPrescriptionResponse {
  comment: {
    id: string;
    author_name: string | null;
    content: string;
    attachment_path: string | null;
    created_at: string;
  };
}

/**
 * Crear comentario con o sin adjunto (PDF/imagen). POST multipart a upload-prescription.
 * No requiere auth. Ver docs/swagger.md sección 5.
 */
export async function uploadPrescription(
  payload: UploadPrescriptionPayload
): Promise<UploadPrescriptionResponse> {
  const formData = new FormData();
  formData.append('log_id', payload.log_id);
  formData.append('content', payload.content);
  if (payload.author_name) formData.append('author_name', payload.author_name);

  if (payload.fileUri) {
    const name = payload.fileName ?? 'prescription.pdf';
    const type = payload.fileType ?? 'application/pdf';
    formData.append('file', {
      uri: payload.fileUri,
      name,
      type,
    } as unknown as Blob);
  }

  const url = `${baseUrl}/functions/v1/upload-prescription`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      // Do not set Content-Type; browser/RN sets multipart boundary
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `upload-prescription: ${res.status}`);
  }
  return res.json() as Promise<UploadPrescriptionResponse>;
}
