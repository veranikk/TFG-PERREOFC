/**
 * Persistence module that upserts scraped matches data into Supabase.
 * It keeps scraper output synchronized with the database without duplicating existing rows.
 */

import { getAdminClient } from '../shared/supabase.js';
import type { Database } from '../shared/types/database.js';
import type { ScrapedCalendar, ScrapedMatch } from '../scrapers/competitions.js';
import { ensureTeamExists } from './upsertTeam.js';
import { env } from '../shared/env.js';

type MatchInsert = Database['public']['Tables']['matches']['Insert'];

const RFFM_BASE_URL = 'https://www.rffm.es';
const PLACEHOLDER_DATE = '1900-01-01';

function normalizeShieldUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith('/') ? `${RFFM_BASE_URL}${url}` : url;
}

function getMatchStatus(match: ScrapedMatch): MatchInsert['status'] {
  return match.home_goals !== null || match.away_goals !== null ? 'finished' : 'upcoming';
}

function toMatchRow(match: ScrapedMatch, roundUuidByNumber: Map<number, string>): MatchInsert {
  return {
    id: match.acta_id,
    group_id: match.group_id,
    competition_id: match.competition_id,
    round_number: match.round_number,
    round_id: roundUuidByNumber.get(match.round_number) ?? null,
    home_team_id: match.home_team_id,
    away_team_id: match.away_team_id,
    home_team_name: match.home_team_name,
    away_team_name: match.away_team_name,
    home_shield_url: normalizeShieldUrl(match.home_team_shield),
    away_shield_url: normalizeShieldUrl(match.away_team_shield),
    external_home_team_id: match.home_team_id,
    external_away_team_id: match.away_team_id,
    home_score: match.home_goals,
    away_score: match.away_goals,
    home_penalty_score: null,
    away_penalty_score: null,
    status: getMatchStatus(match),
    is_closed: match.home_goals !== null || match.away_goals !== null,
    is_suspended: false,
    date: match.date ?? PLACEHOLDER_DATE,
    time: match.time,
    venue_id: match.venue_id,
    venue_name: match.venue_name,
    scraped_at: new Date().toISOString(),
  };
}

/**
 * Upsert de un calendario completo:
 * 1. Asegurar que todas las venues existen
 * 2. Asegurar que todos los equipos existen
 * 3. Crear/actualizar match_rounds y obtener sus uuid
 * 4. Insertar/actualizar los matches con round_id correcto
 */
export async function upsertMatches(
  calendar: ScrapedCalendar,
  opts: { seasonId: number }
) {
  const supabase = getAdminClient();
  const { seasonId } = opts;
  let upserted = 0;

  // Solo guardamos partidos en los que participa el Perreo FC
  const matches = calendar.matches.filter(
    (m) => m.home_team_id === env.OWN_TEAM_ID || m.away_team_id === env.OWN_TEAM_ID
  );

  if (matches.length === 0) {
    return { group_id: calendar.group.id, upserted: 0 };
  }

  // ✅ PASO 1: Venues (deduplicadas por ID)
  const venuesMap = new Map<number, { id: number; name: string }>();
  for (const match of matches) {
    if (match.venue_id != null && !venuesMap.has(match.venue_id)) {
      venuesMap.set(match.venue_id, {
        id: match.venue_id,
        name: match.venue_name ?? `Venue ${match.venue_id}`,
      });
    }
  }
  if (venuesMap.size > 0) {
    try {
      const { error } = await supabase
        .from('venues')
        .upsert(Array.from(venuesMap.values()), { onConflict: 'id' });
      if (error) throw error;
    } catch (err) {
      console.error('Error upserting venues (continuando con matches):', err);
    }
  }

  // ✅ PASO 2: Equipos (auto-fetch si no existen)
  const teamIds = new Set<number>();
  for (const match of matches) {
    if (match.home_team_id) teamIds.add(match.home_team_id);
    if (match.away_team_id) teamIds.add(match.away_team_id);
  }
  for (const teamId of teamIds) {
    try {
      await ensureTeamExists(teamId, seasonId);
    } catch (err) {
      console.error(`Error ensuring team ${teamId} exists (continuando):`, err);
    }
  }

  // ✅ PASO 3: Match rounds — upsert por (group_id, round_number) y recuperar uuid
  const roundsByNumber = new Map<number, { group_id: number; round_number: number; round_date: string | null }>();
  for (const match of matches) {
    if (!roundsByNumber.has(match.round_number)) {
      roundsByNumber.set(match.round_number, {
        group_id: match.group_id,
        round_number: match.round_number,
        round_date: match.date ?? null,
      });
    }
  }

  const roundUuidByNumber = new Map<number, string>();
  if (roundsByNumber.size > 0) {
    try {
      const { data: insertedRounds, error } = await supabase
        .from('match_rounds')
        .upsert(Array.from(roundsByNumber.values()), { onConflict: 'group_id,round_number' })
        .select('id, round_number');
      if (error) throw error;
      for (const r of insertedRounds ?? []) {
        roundUuidByNumber.set(r.round_number, r.id);
      }
    } catch (err) {
      console.error('Error upserting match_rounds (continuando sin round_id):', err);
    }
  }

  // ✅ PASO 4: Matches con round_id ya resuelto
  for (const match of matches) {
    try {
      const { error } = await supabase
        .from('matches')
        .upsert(toMatchRow(match, roundUuidByNumber), { onConflict: 'id' });

      if (error) throw error;
      upserted += 1;
    } catch (error) {
      console.error('Error upserting match', {
        matchId: match.acta_id,
        groupId: match.group_id,
        competitionId: match.competition_id,
        venueId: match.venue_id,
        error,
      });
    }
  }

  return {
    group_id: calendar.group.id,
    upserted,
  };
}
