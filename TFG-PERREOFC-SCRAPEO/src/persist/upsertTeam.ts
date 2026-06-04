/**
 * Persistence module that upserts scraped team data into Supabase.
 * It keeps scraper output synchronized with the database without duplicating existing rows.
 */

import { getAdminClient } from '../shared/supabase.js';
import type { ScrapedTeam } from '../scrapers/team.js';
import { scrapeTeam } from '../scrapers/team.js';

/** Persiste datos de un equipo scrapeados en Supabase (venue, club, team, jugadores, staff). */
export async function upsertTeam(
  data: ScrapedTeam,
  opts: { seasonId: number }
): Promise<void> {
  const supabase = getAdminClient();
  const { seasonId } = opts;

  // 1. Venue - upsert del campo/estadio del partido
  if (data.venue) {
    const { error } = await supabase
      .from('venues')
      .upsert(data.venue, { onConflict: 'id' });
    if (error) throw new Error(`Venue: ${error.message}`);
  }

  // 2. Club - datos del club propietario del equipo
  {
    const { error } = await supabase
      .from('clubs')
      .upsert(
        { ...data.club, home_venue_id: data.venue?.id ?? null },
        { onConflict: 'id' }
      );
    if (error) throw new Error(`Club: ${error.message}`);
  }

  // 3. Team - entidad principal (id, nombre, categoría, club_id)
  {
    const { error } = await supabase
      .from('teams')
      .upsert(
        {
          id: data.team.id,
          name: data.team.name,
          category: data.team.category,
          category_code: data.team.category_code,
          club_id: data.club.id,
          home_venue_id: data.venue?.id ?? null,
        },
        { onConflict: 'id' }
      );
    if (error) throw new Error(`Team: ${error.message}`);
  }

  // 4. Players - datos básicos de jugadores (sin estadísticas)
  if (data.players.length > 0) {
    const { error } = await supabase.from('players').upsert(
      data.players.map((p) => ({
        id: p.id,
        full_name: p.full_name,
        first_name: p.first_name,
        last_name: p.last_name,
        birth_year: p.birth_year ?? null,
      })),
      { onConflict: 'id' }
    );
    if (error) throw new Error(`Players: ${error.message}`);
  }

  // 5. Team_players - relación muchos a muchos equipo-jugador-temporada
  if (data.players.length > 0) {
    const { error } = await supabase.from('team_players').upsert(
      data.players.map((p) => ({
        team_id: data.team.id,
        player_id: p.id,
        season_id: seasonId,
      })),
      { onConflict: 'team_id,player_id,season_id' }
    );
    if (error) throw new Error(`Team_players: ${error.message}`);
  }

  // 6. Staff_members - entrenadores y cuerpo técnico
  if (data.staff.length > 0) {
    const { error } = await supabase.from('staff_members').upsert(
      data.staff.map((s) => ({ id: s.id, full_name: s.full_name })),
      { onConflict: 'id' }
    );
    if (error) throw new Error(`Staff: ${error.message}`);
  }

  // 7. Team_staff - relación entre equipo y staff
  if (data.staff.length > 0) {
    const { error } = await supabase.from('team_staff').upsert(
      data.staff.map((s) => ({
        team_id: data.team.id,
        staff_id: s.id,
        season_id: seasonId,
        role: s.role,
      })),
      { onConflict: 'team_id,staff_id,season_id,role' }
    );
    if (error) throw new Error(`Team_staff: ${error.message}`);
  }
}

/**
 * Asegura que un team existe en BD. Si no, hace scrape + upsert completo.
 * Útil en upsertMatches para auto-popular equipos rivales.
 */
export async function ensureTeamExists(teamId: number, seasonId: number): Promise<void> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('teams')
    .select('id')
    .eq('id', teamId)
    .maybeSingle();

  if (error) throw new Error(`ensureTeamExists check: ${error.message}`);
  if (data) return; // ya existe

  console.log(`[ensureTeamExists] Auto-fetching team ${teamId}`);
  const scraped = await scrapeTeam(teamId);
  await upsertTeam(scraped, { seasonId });
}
