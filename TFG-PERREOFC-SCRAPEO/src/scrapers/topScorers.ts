/**
 * Scraper module that extracts top scorers data from the source website.
 * It normalizes scraped page content before persistence code stores it in Supabase.
 */

import { withContext } from '../lib/browser.js';
import {
  trim,
  toInt,
  toIntOrZero,
  toFloatOrNull,
  prefixRffmUrl,
} from '../lib/normalize.js';

export interface ScrapedTopScorers {
  group: {
    id: number;
    competition_id: number;
    name: string;
  };
  competition: {
    id: number;
    name: string;
  };
  snapshot_date: string; // YYYY-MM-DD
  scorers: Array<{
    position: number;
    external_player_id: number;
    player_name: string;
    player_photo_url: string | null;
    external_team_id: number;
    team_name: string;
    team_shield_url: string | null;
    matches_played: number;
    goals: number;
    penalty_goals: number;
    goals_per_match: number | null;
  }>;
}

const BASE_URL = 'https://www.rffm.es/competicion/goleadores';

export interface ScrapeTopScorersParams {
  season_id: number;
  competition_id: number;
  group_id: number;
  game_type_id: number;
  /** Fecha del snapshot. Si se omite, hoy. */
  snapshot_date?: string;
}

export async function scrapeTopScorers(
  p: ScrapeTopScorersParams,
): Promise<ScrapedTopScorers> {
  const params = new URLSearchParams({
    temporada: String(p.season_id),
    competicion: String(p.competition_id),
    grupo: String(p.group_id),
    tipojuego: String(p.game_type_id),
  });
  const url = `${BASE_URL}?${params.toString()}`;

  return withContext(async (ctx) => {
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const raw = await page.evaluate(() => {
      const el = document.getElementById('__NEXT_DATA__');
      if (!el?.textContent) return null;
      const data = JSON.parse(el.textContent);
      return data?.props?.pageProps ?? null;
    });

    if (!raw) throw new Error('No se pudo extraer __NEXT_DATA__');
    if (!raw.scorers) throw new Error('pageProps.scorers no existe');
    if (!Array.isArray(raw.scorers.goles)) {
      throw new Error('pageProps.scorers.goles no es un array');
    }

    return normalize(raw, p);
  });
}

function normalize(
  raw: any,
  p: ScrapeTopScorersParams,
): ScrapedTopScorers {
  const snapshot_date = p.snapshot_date ?? new Date().toISOString().slice(0, 10);

  const scorers = raw.scorers.goles.map((g: any, idx: number) => ({
    position: idx + 1,
    external_player_id: toInt(g.codigo_jugador),
    player_name: trim(g.jugador),
    player_photo_url: prefixRffmUrl(g.foto),
    external_team_id: toInt(g.codigo_equipo),
    team_name: trim(g.nombre_equipo),
    team_shield_url: prefixRffmUrl(g.escudo_equipo),
    matches_played: toIntOrZero(g.partidos_jugados),
    goals: toIntOrZero(g.goles),
    penalty_goals: toIntOrZero(g.goles_penalti),
    goals_per_match: toFloatOrNull(g.goles_por_partidos),
  }));

  return {
    group: {
      id: toInt(raw.group.codigo),
      competition_id: toInt(raw.competition.codigo),
      name: trim(raw.group.nombre),
    },
    competition: {
      id: toInt(raw.competition.codigo),
      name: trim(raw.competition.nombre),
    },
    snapshot_date,
    scorers,
  };
}
