/**
 * Persistence module that upserts scraped player data into Supabase.
 * It keeps scraper output synchronized with the database without duplicating existing rows.
 */

import { getAdminClient } from '../shared/supabase.js';
import { ensureTeamExists } from './upsertTeam.js';
import type { ScrapedPlayer } from '../scrapers/player.js';

export interface UpsertPlayerOpts {
  /** Si true, no persiste competitions ni competition_groups del jugador.
   *  Usar cuando el contexto (competición/grupo) ya está correcto en BD. */
  skipCompetitions?: boolean;
}

/** Persiste datos de jugador scrapeados: jugador, competiciones, team_players y estadísticas por temporada. */
export async function upsertPlayer(data: ScrapedPlayer, opts: UpsertPlayerOpts = {}): Promise<void> {
  const supabase = getAdminClient();

  // 1. Player - datos personales del jugador (id, nombre, fecha nacimiento, foto)
  {
    const { error } = await supabase
      .from('players')
      .upsert(data.player, { onConflict: 'id' });
    if (error) throw new Error(`Player: ${error.message}`);
  }

  // 2 & 3. Competitions + Groups - omitir si skipCompetitions=true para evitar
  // que datos de otras competiciones (copa, otras ligas) contaminen la BD
  if (!opts.skipCompetitions) {
    // Upsert de competiciones únicas (deduped por ID)
    if (data.competitions.length > 0) {
      const compMap = new Map<number, ScrapedPlayer['competitions'][number]['competition']>();
      for (const c of data.competitions) compMap.set(c.competition.id, c.competition);

      const { error } = await supabase
        .from('competitions')
        .upsert([...compMap.values()], { onConflict: 'id' });
      if (error) throw new Error(`Competitions: ${error.message}`);
    }

    // Upsert de grupos únicos (deduped por ID)
    if (data.competitions.length > 0) {
      const groupMap = new Map<number, ScrapedPlayer['competitions'][number]['group']>();
      for (const c of data.competitions) groupMap.set(c.group.id, c.group);

      const { error } = await supabase
        .from('competition_groups')
        .upsert([...groupMap.values()], { onConflict: 'id' });
      if (error) throw new Error(`Competition groups: ${error.message}`);
    }
  }

  // 4. Team data - si el jugador tiene equipo actual, persistir relaciones
  if (data.current_team_id != null) {
    // 4a. Asegurar que el equipo existe (auto-fetch si no)
    await ensureTeamExists(data.current_team_id, data.season_id);

    // 4b. team_players - dorsal y posición del jugador en el equipo
    {
      const { error } = await supabase.from('team_players').upsert(
        {
          team_id: data.current_team_id,
          player_id: data.player.id,
          season_id: data.season_id,
          dorsal: data.current_dorsal,
          position: data.current_position,
        },
        { onConflict: 'team_id,player_id,season_id' }
      );
      if (error) throw new Error(`Team_players: ${error.message}`);
    }

    // 4c. player_season_stats - estadísticas agregadas del jugador en la temporada
    {
      const { error } = await supabase.from('player_season_stats').upsert(
        {
          player_id: data.player.id,
          team_id: data.current_team_id,
          season_id: data.season_id,
          ...data.season_stats,
        },
        { onConflict: 'player_id,team_id,season_id' }
      );
      if (error) throw new Error(`Player_season_stats: ${error.message}`);
    }
  }
}