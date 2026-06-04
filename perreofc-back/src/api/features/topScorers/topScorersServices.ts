/**
 * Contains the business and persistence logic for the top scorers backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import { NotFoundError } from '../../errors.js';

export async function getTopScorers(groupId: number, limit: number) {
  const supabase = getAdminClient();

  const { data: latest, error: latestErr } = await supabase
    .from('top_scorers')
    .select('snapshot_date')
    .eq('group_id', groupId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestErr) throw latestErr;
  if (!latest) throw new NotFoundError('Sin goleadores para este grupo');

  const { data: rows, error } = await supabase
    .from('top_scorers')
    .select('position, external_player_id, player_id, player_name, player_photo_url, external_team_id, team_id, team_name, team_shield_url, matches_played, goals, penalty_goals, goals_per_match')
    .eq('group_id', groupId)
    .eq('snapshot_date', latest.snapshot_date)
    .order('position', { ascending: true })
    .limit(limit);
  if (error) throw error;

  return {
    groupId,
    snapshotDate: latest.snapshot_date,
    entries: (rows ?? []).map((r) => ({
      position: r.position,
      playerId: r.player_id ?? r.external_player_id,
      playerName: r.player_name,
      playerPhotoUrl: r.player_photo_url,
      teamId: r.team_id ?? r.external_team_id,
      teamName: r.team_name,
      teamShieldUrl: r.team_shield_url,
      matchesPlayed: r.matches_played,
      goals: r.goals,
      penaltyGoals: r.penalty_goals,
      goalsPerMatch: r.goals_per_match != null ? Number(r.goals_per_match) : null,
    })),
  };
}




