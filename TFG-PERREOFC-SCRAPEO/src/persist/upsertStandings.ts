/**
 * Persistence module that upserts scraped standings data into Supabase.
 * It keeps scraper output synchronized with the database without duplicating existing rows.
 */

import { getAdminClient } from '../shared/supabase.js';
import type { ScrapedStandings } from '../scrapers/standings.js';
import { ensureTeamExists } from './upsertTeam.js';

const RFFM_BASE_URL = 'https://www.rffm.es';
function normalizeShieldUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith('/') ? `${RFFM_BASE_URL}${url}` : url;
}

/** Persiste clasificación scrapeada (competición, grupo, entradas, formación) en Supabase. */
export async function upsertStandings(data: ScrapedStandings): Promise<void> {
  const supabase = getAdminClient();

  // 1. Competition - datos de la competición (liga/copa)
  {
    const { error } = await supabase
      .from('competitions')
      .upsert(data.competition, { onConflict: 'id' });
    if (error) throw new Error(`Competition: ${error.message}`);
  }

  // 2. Competition group - datos del grupo de clasificación
  {
    const { error } = await supabase
      .from('competition_groups')
      .upsert(data.group, { onConflict: 'id' });
    if (error) throw new Error(`Competition group: ${error.message}`);
  }

  // 3. Teams - asegurar que los equipos existen (auto-fetch si no)
  const candidateTeamIds = data.entries
    .map((e) => e.team_id)
    .filter((id): id is number => id != null);

  for (const teamId of candidateTeamIds) {
    await ensureTeamExists(teamId, data.competition.season_id);
  }

  // 4. Classification entries (ahora el team_id siempre debería existir si no es nulo en el scrape)
  const entryRows = data.entries.map((e) => ({
    group_id: data.group.id,
    round_number: data.round_number,
    round_date: data.round_date,
    position: e.position,
    team_id: e.team_id,
    team_name: e.team_name,
    team_shield_url: normalizeShieldUrl(e.team_shield_url),
    pj: e.pj,
    wins: e.wins,
    draws: e.draws,
    losses: e.losses,
    penalties: e.penalties,
    goals_for: e.goals_for,
    goals_against: e.goals_against,
    pts: e.pts,
    pts_sanction: e.pts_sanction,
    pj_home: e.pj_home,
    wins_home: e.wins_home,
    draws_home: e.draws_home,
    losses_home: e.losses_home,
    pts_home: e.pts_home,
    pj_away: e.pj_away,
    wins_away: e.wins_away,
    draws_away: e.draws_away,
    losses_away: e.losses_away,
    pts_away: e.pts_away,
  }));

  const { data: insertedEntries, error: entriesErr } = await supabase
    .from('classification_entries')
    .upsert(entryRows, { onConflict: 'group_id,round_number,position' })
    .select('id, position');

  if (entriesErr) throw new Error(`Classification entries: ${entriesErr.message}`);
  if (!insertedEntries) throw new Error('Classification entries: no rows returned');

  // 5. Mapa position → id
  const idByPosition = new Map<number, string>();
  for (const e of insertedEntries) idByPosition.set(e.position, e.id);

  // 6. Borrar forms antiguas (idempotencia)
  const entryIds = insertedEntries.map((e) => e.id);
  if (entryIds.length > 0) {
    const { error } = await supabase
      .from('classification_form')
      .delete()
      .in('classification_entry_id', entryIds);
    if (error) throw new Error(`Form delete: ${error.message}`);
  }

  // 7. Insertar forms nuevas
  const formRows: Array<{
    classification_entry_id: string;
    position: number;
    result: 'G' | 'E' | 'P';
  }> = [];

  for (const entry of data.entries) {
    const entryId = idByPosition.get(entry.position);
    if (!entryId) continue;
    entry.form.forEach((result, idx) => {
      formRows.push({
        classification_entry_id: entryId,
        position: idx + 1, // 1-indexed, 1 = más reciente
        result,
      });
    });
  }

  if (formRows.length > 0) {
    const { error } = await supabase.from('classification_form').insert(formRows);
    if (error) throw new Error(`Form insert: ${error.message}`);
  }
}