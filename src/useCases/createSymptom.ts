import { supabase } from '@/src/infrastructure/supabase';
import type { SymptomMaster } from '@/src/domain/types';

/**
 * Agregar nuevo síntoma en symptoms_master (creatable dropdown).
 * RLS exige created_by = usuario actual. Ver backend docs swagger sección 8.
 */
export async function createSymptom(name: string, userId: string): Promise<SymptomMaster | null> {
  const { data, error } = await supabase
    .from('symptoms_master')
    .insert({ name: name.trim(), created_by: userId })
    .select('id, name')
    .single();
  if (error) throw error;
  return data as SymptomMaster;
}
