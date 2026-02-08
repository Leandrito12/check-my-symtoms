import { supabase } from '@/src/infrastructure/supabase';

const BUCKET = 'symptoms-photos';
const FILE_NAME = 'symptom.jpg';

/**
 * Sube la foto del síntoma al bucket symptoms-photos.
 * Ruta: {patient_id}/{log_id}/symptom.jpg (según backend).
 * Requiere sesión (JWT). RLS del bucket debe permitir upload del usuario.
 */
export async function uploadSymptomPhoto(
  localUri: string,
  patientId: string,
  logId: string
): Promise<string> {
  const path = `${patientId}/${logId}/${FILE_NAME}`;

  const response = await fetch(localUri, { method: 'GET' });
  const blob = await response.blob();

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;

  return path;
}
