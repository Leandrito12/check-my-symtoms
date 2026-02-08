import { supabase } from '@/src/infrastructure/supabase';
import type { SymptomMaster } from '@/src/domain/types';

/**
 * Lista de síntomas para el dropdown. Tabla symptoms_master (PostgREST).
 * Requiere usuario autenticado (JWT). Ver backend docs swagger sección 7.
 */
export async function fetchSymptoms(): Promise<SymptomMaster[]> {
  const { data, error } = await supabase
    .from('symptoms_master')
    .select('id, name')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as SymptomMaster[];
}
