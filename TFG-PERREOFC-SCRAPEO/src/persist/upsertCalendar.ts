/**
 * Persistence module that upserts scraped calendar data into Supabase.
 * It keeps scraper output synchronized with the database without duplicating existing rows.
 */

import { getAdminClient } from '../shared/supabase.js';
import type { ScrapedCalendar } from '../scrapers/calendar.js';

const RFFM_BASE_URL = 'https://www.rffm.es';
function normalizeShieldUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith('/') ? `${RFFM_BASE_URL}${url}` : url;
}

export async function upsertCalendar(data: ScrapedCalendar): Promise<{
  rounds: number;
  matches_inserted: number;
  matches_updated: number;
}> {
  const supabase = getAdminClient();

  // 1. Competition + group
  {
    const { error } = await supabase
      .from('competitions')
      .upsert(data.competition, { onConflict: 'id' });
    if (error) throw new Error(`Competition: ${error.message}`);
  }
  {
    const { error } = await supabase
      .from('competition_groups')
      .upsert(data.group, { onConflict: 'id' });
    if (error) throw new Error(`Competition group: ${error.message}`);
  }

  // 2. Bulk venues (deduplicados)
  const venuesMap = new Map<number, { id: number; name: string }>();
  for (const round of data.rounds) {
    for (const m of round.matches) {
      if (m.venue_id != null && !venuesMap.has(m.venue_id)) {
        venuesMap.set(m.venue_id, {
          id: m.venue_id,
          name: m.venue_name ?? `Campo ${m.venue_id}`,
        });
      }
    }
  }
  if (venuesMap.size > 0) {
    const { error } = await supabase
      .from('venues')
      .upsert([...venuesMap.values()], { onConflict: 'id' });
    if (error) throw new Error(`Venues: ${error.message}`);
  }

  // 3. Match rounds
  const roundRows = data.rounds.map((r) => ({
    group_id: data.group.id,
    round_number: r.round_number,
    round_date: r.round_date,
  }));
  const { data: insertedRounds, error: roundsErr } = await supabase
    .from('match_rounds')
    .upsert(roundRows, { onConflict: 'group_id,round_number' })
    .select('id, round_number');
  if (roundsErr) throw new Error(`Rounds: ${roundsErr.message}`);

  const roundIdByNumber = new Map<number, string>();
  for (const r of insertedRounds ?? []) roundIdByNumber.set(r.round_number, r.id);

  // 4. Lookup teams existentes
  const allTeamIds = new Set<number>();
  for (const round of data.rounds) {
    for (const m of round.matches) {
      allTeamIds.add(m.home_team_id);
      allTeamIds.add(m.away_team_id);
    }
  }
  const existingTeamIds = new Set<number>();
  if (allTeamIds.size > 0) {
    const { data: existing, error } = await supabase
      .from('teams')
      .select('id')
      .in('id', [...allTeamIds]);
    if (error) throw new Error(`Teams lookup: ${error.message}`);
    for (const t of existing ?? []) existingTeamIds.add(t.id);
  }

  // 5. Lookup matches existentes (id + round_id actual)
  const allMatchIds = data.rounds.flatMap((r) => r.matches.map((m) => m.id));
  const existingMatchInfo = new Map<number, { round_id: string | null }>();
  if (allMatchIds.length > 0) {
    const { data: existing, error } = await supabase
      .from('matches')
      .select('id, round_id')
      .in('id', allMatchIds);
    if (error) throw new Error(`Matches lookup: ${error.message}`);
    for (const m of existing ?? []) {
      existingMatchInfo.set(m.id, { round_id: m.round_id });
    }
  }

  // 6. Separar new vs existing
  const newMatchRows: any[] = [];
  const matchesToUpdateRoundId: Array<{ id: number; round_id: string | null }> = [];

  for (const round of data.rounds) {
    const round_id = roundIdByNumber.get(round.round_number) ?? null;
    for (const m of round.matches) {
      const existing = existingMatchInfo.get(m.id);
      if (existing) {
        // Solo update si el round_id en BD difiere del calculado
        if (existing.round_id !== round_id) {
          matchesToUpdateRoundId.push({ id: m.id, round_id });
        }
      } else {
        const hasScores = m.home_score != null && m.away_score != null;
        newMatchRows.push({
          id: m.id,
          round_id,
          home_team_id: existingTeamIds.has(m.home_team_id) ? m.home_team_id : null,
          away_team_id: existingTeamIds.has(m.away_team_id) ? m.away_team_id : null,
          home_team_name: m.home_team_name,
          away_team_name: m.away_team_name,
          home_shield_url: normalizeShieldUrl(m.home_shield_url),
          away_shield_url: normalizeShieldUrl(m.away_shield_url),
          home_score: m.home_score,
          away_score: m.away_score,
          status: hasScores ? 'finished' : 'upcoming',
          is_closed: hasScores,
          is_suspended: false,
          date: m.date,
          time: m.time,
          venue_id: m.venue_id,
          venue_name: m.venue_name,
        });
      }
    }
  }

  // 7. INSERT new matches
  if (newMatchRows.length > 0) {
    const { error } = await supabase.from('matches').insert(newMatchRows);
    if (error) throw new Error(`Matches insert: ${error.message}`);
  }

  // 8. UPDATE round_id de existentes (en paralelo en chunks de 10)
  if (matchesToUpdateRoundId.length > 0) {
    const chunks = chunkArray(matchesToUpdateRoundId, 10);
    for (const chunk of chunks) {
      await Promise.all(
        chunk.map((u) =>
          supabase
            .from('matches')
            .update({ round_id: u.round_id })
            .eq('id', u.id)
            .then(({ error }) => {
              if (error) throw new Error(`Match ${u.id} update: ${error.message}`);
            })
        )
      );
    }
  }

  return {
    rounds: data.rounds.length,
    matches_inserted: newMatchRows.length,
    matches_updated: matchesToUpdateRoundId.length,
  };
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}