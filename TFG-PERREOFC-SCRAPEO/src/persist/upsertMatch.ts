/**
 * Persistence module that upserts scraped match data into Supabase.
 * It keeps scraper output synchronized with the database without duplicating existing rows.
 */

import { getAdminClient } from '../shared/supabase.js';
import { ensureTeamExists } from './upsertTeam.js';
import { splitFullName } from '../lib/normalize.js';
import type { ScrapedMatch } from '../scrapers/match.js';

export async function upsertMatch(
  data: ScrapedMatch,
  opts: { seasonId: number }
): Promise<void> {
  const supabase = getAdminClient();
  const matchId = data.match.id;
  const { seasonId } = opts;

  // 1. Asegurar que ambos teams existen (auto-fetch si no)
  await ensureTeamExists(data.match.home_team_id, seasonId);
  await ensureTeamExists(data.match.away_team_id, seasonId);

  // 2. Venue (si lo hay)
  if (data.venue) {
    const { error } = await supabase
      .from('venues')
      .upsert({ id: data.venue.id, name: data.venue.name }, { onConflict: 'id' });
    if (error) throw new Error(`Venue: ${error.message}`);
  }

  // 3. Players — lineup + cualquier jugador que aparezca en cards o goals pero no en el lineup
  // (RFFM puede incluir tarjetas a jugadores del banquillo que no figuran en el lineup)
  {
    const allPlayers = dedupeBy(
      [
        ...data.lineups.map((l) => ({
          id: l.player_id,
          full_name: l.player_name,
          first_name: l.first_name,
          last_name: l.last_name,
          is_goalkeeper: l.is_goalkeeper,
        })),
        ...data.cards.map((c) => ({
          id: c.player_id,
          full_name: c.player_name,
          first_name: null as string | null,
          last_name: null as string | null,
          is_goalkeeper: false,
        })),
        ...data.goals.map((g) => ({
          id: g.player_id,
          full_name: g.player_name,
          first_name: null as string | null,
          last_name: null as string | null,
          is_goalkeeper: false,
        })),
      ].filter((p) => p.id != null),
      (p) => p.id
    );
    if (allPlayers.length > 0) {
      const { error } = await supabase
        .from('players')
        .upsert(allPlayers, { onConflict: 'id', ignoreDuplicates: false });
      if (error) throw new Error(`Players: ${error.message}`);
    }
  }

  // 4. Staff (entrenadores principales + otros del acta)
  const staffToUpsert: Array<{ id: number; full_name: string }> = [];
  if (data.match.home_coach_id && data.match.home_coach_name) {
    staffToUpsert.push({ id: data.match.home_coach_id, full_name: data.match.home_coach_name });
  }
  if (data.match.away_coach_id && data.match.away_coach_name) {
    staffToUpsert.push({ id: data.match.away_coach_id, full_name: data.match.away_coach_name });
  }
  for (const s of data.staffEntries) {
    staffToUpsert.push({ id: s.staff_id, full_name: s.staff_name });
  }
  if (staffToUpsert.length > 0) {
    const unique = dedupeBy(staffToUpsert, (s) => s.id);
    const { error } = await supabase
      .from('staff_members')
      .upsert(unique, { onConflict: 'id' });
    if (error) throw new Error(`Staff_members: ${error.message}`);
  }

  // 5. Match (entidad principal)
  {
    const { error } = await supabase
      .from('matches')
      .upsert(data.match, { onConflict: 'id' });
    if (error) throw new Error(`Match: ${error.message}`);
  }

  // 6. Lineup entries (delete + insert para idempotencia)
  await deleteAndInsert(supabase, 'match_lineup_entries', matchId,
    data.lineups.map((l) => ({
      match_id: matchId,
      side: l.side,
      player_id: l.player_id,
      player_name: l.player_name,
      dorsal: l.dorsal,
      is_starter: l.is_starter,
      is_substitute: l.is_substitute,
      is_captain: l.is_captain,
      is_goalkeeper: l.is_goalkeeper,
      position: l.position,
    }))
  );

  // 7. Goals
  await deleteAndInsert(supabase, 'match_goals', matchId,
    data.goals.map((g) => ({
      match_id: matchId,
      side: g.side,
      player_id: g.player_id,
      player_name: g.player_name,
      minute: g.minute,
      goal_type_code: g.goal_type_code,
      is_own_goal: false,
    }))
  );

  // 8. Cards
  await deleteAndInsert(supabase, 'match_cards', matchId,
    data.cards.map((c) => ({
      match_id: matchId,
      side: c.side,
      player_id: c.player_id,
      player_name: c.player_name,
      minute: c.minute,
      card_type_code: c.card_type_code,
    }))
  );

  // 9. Match staff entries
  await deleteAndInsert(supabase, 'match_staff_entries', matchId,
    data.staffEntries.map((s) => ({
      match_id: matchId,
      side: s.side,
      staff_id: s.staff_id,
      staff_name: s.staff_name,
      role_description: s.role_description,
    }))
  );

  // 10. Enriquecer team_players.dorsal con los del acta
  await enrichDorsales(supabase, data, seasonId);
}

// ---------- Helpers ----------

async function deleteAndInsert(
  supabase: ReturnType<typeof getAdminClient>,
  table: 'match_lineup_entries' | 'match_goals' | 'match_cards' | 'match_staff_entries',
  matchId: number,
  rows: any[]
) {
  const { error: delErr } = await supabase.from(table).delete().eq('match_id', matchId);
  if (delErr) throw new Error(`${table} delete: ${delErr.message}`);
  if (rows.length === 0) return;
  const { error: insErr } = await supabase.from(table).insert(rows);
  if (insErr) throw new Error(`${table} insert: ${insErr.message}`);
}

async function enrichDorsales(
  supabase: ReturnType<typeof getAdminClient>,
  data: ScrapedMatch,
  seasonId: number
) {
  const updates: Array<{ team_id: number; player_id: number; dorsal: number }> = [];
  for (const l of data.lineups) {
    if (l.dorsal == null) continue;
    const team_id = l.side === 'home' ? data.match.home_team_id : data.match.away_team_id;
    updates.push({ team_id, player_id: l.player_id, dorsal: l.dorsal });
  }
  if (updates.length === 0) return;

  const rows = updates.map((u) => ({
    team_id: u.team_id,
    player_id: u.player_id,
    season_id: seasonId,
    dorsal: u.dorsal,
  }));
  const { error } = await supabase
    .from('team_players')
    .upsert(rows, { onConflict: 'team_id,player_id,season_id' });
  if (error) throw new Error(`Enrich dorsales: ${error.message}`);
}

function dedupeBy<T>(arr: T[], keyFn: (x: T) => number | string): T[] {
  const map = new Map<number | string, T>();
  for (const item of arr) map.set(keyFn(item), item);
  return Array.from(map.values());
}
