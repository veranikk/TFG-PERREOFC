/**
 * Contains the business and persistence logic for the groups backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import { NotFoundError } from '../../errors.js';

export async function getGroupsForCompetition(competitionId: number) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('competition_groups')
    .select('*')
    .eq('competition_id', competitionId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getGroupHeader(groupId: number) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('competition_groups')
    .select(`
      id, 
      name, 
      competition_id,
      competition:competitions(
        name,
        season:seasons(name)
      )
    `)
    .eq('id', groupId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new NotFoundError('Grupo no encontrado');
  return data;
}





