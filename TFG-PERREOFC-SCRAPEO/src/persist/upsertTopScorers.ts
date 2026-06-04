/**
 * Persistence module that upserts scraped top scorers data into Supabase.
 * It keeps scraper output synchronized with the database without duplicating existing rows.
 */

import { getAdminClient } from '../shared/supabase.js';
import type { ScrapedTopScorers } from '../scrapers/topScorers.js';
import { ensureTeamExists } from './upsertTeam.js';

export async function upsertTopScorers(
  data: ScrapedTopScorers,
  opts: { seasonId: number }
): Promise<void> {
  const supabase = getAdminClient();
  const { seasonId } = opts;

  // 1. Asegurar que los equipos existen (auto-fetch si no)
  const candidateTeamIds = new Set(data.scorers.map((s) => s.external_team_id));

  for (const teamId of candidateTeamIds) {
    try {
      await ensureTeamExists(teamId, seasonId);
    } catch (err) {
      console.error(`Error ensuring team ${teamId} exists (continuando):`, err);
    }
  }

  // 2. Filtrar player_ids existentes para no romper FKs
  const candidatePlayerIds = data.scorers.map((s) => s.external_player_id);
  const existingPlayerIds = new Set<number>();
  if (candidatePlayerIds.length > 0) {
    const { data: existing, error } = await supabase
      .from('players')
      .select('id')
      .in('id', candidatePlayerIds);
    if (error) throw new Error(`Players lookup: ${error.message}`);
    for (const p of existing ?? []) existingPlayerIds.add(p.id);
  }

  // 3. Construir filas
  const rows = data.scorers.map((s) => ({
    group_id: data.group.id,
    snapshot_date: data.snapshot_date,
    position: s.position,
    external_player_id: s.external_player_id,
    player_id: existingPlayerIds.has(s.external_player_id) ? s.external_player_id : null,
    player_name: s.player_name,
    player_photo_url: s.player_photo_url,
    external_team_id: s.external_team_id,
    team_id: s.external_team_id,
    team_name: s.team_name,
    team_shield_url: s.team_shield_url,
    matches_played: s.matches_played,
    goals: s.goals,
    penalty_goals: s.penalty_goals,
    goals_per_match: s.goals_per_match,
  }));

  // Borrar snapshot anterior para este grupo antes de insertar el nuevo
  const { error: deleteError } = await supabase
    .from('top_scorers')
    .delete()
    .eq('group_id', data.group.id)
    .neq('snapshot_date', data.snapshot_date);

  if (deleteError) throw new Error(`Top scorers delete old: ${deleteError.message}`);

  const { error } = await supabase
    .from('top_scorers')
    .upsert(rows, { onConflict: 'group_id,snapshot_date,position' });

  if (error) throw new Error(`Top scorers: ${error.message}`);
}
