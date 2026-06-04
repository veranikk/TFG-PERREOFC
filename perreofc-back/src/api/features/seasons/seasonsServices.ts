/**
 * Contains the business and persistence logic for the seasons backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import { NotFoundError } from '../../errors.js';

let cached: number | null = null;

export async function getSeasons() {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .order('id', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getCurrentSeason() {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('is_current', true)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new NotFoundError('Temporada actual no encontrada');
  return data;
}

export async function getSeasonById(seasonId: number) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('id', seasonId)
    .single();

  if (error || !data) throw new NotFoundError('Temporada no encontrada');
  return data;
}

export async function getCurrentSeasonId(): Promise<number> {
  if (cached !== null) return cached;
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('seasons')
    .select('id')
    .eq('is_current', true)
    .single();
  if (error || !data) throw new Error('No hay temporada actual configurada');
  cached = data.id;
  return data.id;
}





