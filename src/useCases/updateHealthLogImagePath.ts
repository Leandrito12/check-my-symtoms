import { supabase } from '@/src/infrastructure/supabase';

/**
 * Actualiza image_path de un health_log tras subir la foto a Storage.
 * RLS debe permitir update solo cuando patient_id = usuario actual.
 */
export async function updateHealthLogImagePath(
  logId: string,
  imagePath: string
): Promise<void> {
  const { error } = await supabase
    .from('health_logs')
    .update({ image_path: imagePath })
    .eq('id', logId);
  if (error) throw error;
}
