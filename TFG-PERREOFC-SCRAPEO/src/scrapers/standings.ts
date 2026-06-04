/**
 * Scraper module that extracts standings data from the source website.
 * It normalizes scraped page content before persistence code stores it in Supabase.
 */

import { withContext } from '../lib/browser.js';
import {
  trim,
  toInt,
  toIntOrNull,
  toIntOrZero,
  parseDateDMY,
} from '../lib/normalize.js';

export interface ScrapedStandings {
  competition: {
    id: number;
    name: string;
    type: 'liga' | 'copa' | 'other';
    season_id: number;
  };
  group: {
    id: number;
    competition_id: number;
    name: string;
  };
  round_number: number;
  round_date: string | null;
  entries: Array<{
    position: number;
    team_id: number | null;
    team_name: string;
    team_shield_url: string | null;
    pj: number;
    wins: number;
    draws: number;
    losses: number;
    penalties: number;
    goals_for: number;
    goals_against: number;
    pts: number;
    pts_sanction: number;
    pj_home: number;
    wins_home: number;
    draws_home: number;
    losses_home: number;
    pts_home: number;
    pj_away: number;
    wins_away: number;
    draws_away: number;
    losses_away: number;
    pts_away: number;
    form: Array<'G' | 'E' | 'P'>;
  }>;
}

const BASE_URL = 'https://www.rffm.es/competicion/clasificaciones';

export interface ScrapeStandingsParams {
  season_id: number;
  competition_id: number;
  group_id: number;
  game_type_id: number;
  round_number?: number;
}

/** Scrapea clasificación desde rffm.es y devuelve datos normalizados (competición, grupo, jornada, entradas). */
export async function scrapeStandings(p: ScrapeStandingsParams): Promise<ScrapedStandings> {
  const params = new URLSearchParams({
    temporada: String(p.season_id),
    competicion: String(p.competition_id),
    grupo: String(p.group_id),
    tipojuego: String(p.game_type_id),
  });
  if (p.round_number != null) params.set('jornada', String(p.round_number));

  const url = `${BASE_URL}?${params.toString()}`;

  return withContext(async (ctx) => {
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Extraer datos JSON embebidos en __NEXT_DATA__
    const raw = await page.evaluate(() => {
      const el = document.getElementById('__NEXT_DATA__');
      return el?.textContent ? JSON.parse(el.textContent) : null;
    });

    const standings = raw?.props?.pageProps?.standings;
    if (!standings || standings.estado !== '1') {
      throw new Error(
        `Standings comp=${p.competition_id} group=${p.group_id}: no disponibles`
      );
    }

    return normalize(standings, p);
  });
}

// ---------- Normalización ----------

function normalize(raw: any, p: ScrapeStandingsParams): ScrapedStandings {
  const compName = trim(raw.competicion);
  const groupName = trim(raw.grupo);

  const competition: ScrapedStandings['competition'] = {
    id: toInt(raw.codigo_competicion),
    name: compName,
    type: compName.toUpperCase().includes('COPA') ? 'copa' : 'liga',
    season_id: p.season_id,
  };

  const group: ScrapedStandings['group'] = {
    id: toInt(raw.codigo_grupo),
    competition_id: competition.id,
    name: groupName,
  };

  const round_number = toInt(raw.jornada);
  const round_date = parseDateDMY(raw.fecha_jornada);

  const entries: ScrapedStandings['entries'] = (raw.clasificacion ?? []).map((e: any) => ({
    position: toInt(e.posicion),
    team_id: toIntOrNull(e.codequipo),
    team_name: trim(e.nombre),
    team_shield_url: trim(e.url_img) || null,
    pj: toInt(e.jugados),
    wins: toInt(e.ganados),
    draws: toInt(e.empatados),
    losses: toInt(e.perdidos),
    penalties: toIntOrZero(e.penaltis),
    goals_for: toInt(e.goles_a_favor),
    goals_against: toInt(e.goles_en_contra),
    pts: toInt(e.puntos),
    pts_sanction: toIntOrZero(e.puntos_sancion),
    pj_home: toIntOrZero(e.jugados_casa),
    wins_home: toIntOrZero(e.ganados_casa),
    draws_home: toIntOrZero(e.empatados_casa),
    losses_home: toIntOrZero(e.perdidos_casa),
    pts_home: toIntOrZero(e.puntos_local),
    pj_away: toIntOrZero(e.jugados_fuera),
    wins_away: toIntOrZero(e.ganados_fuera),
    draws_away: toIntOrZero(e.empatados_fuera),
    losses_away: toIntOrZero(e.perdidos_fuera),
    pts_away: toIntOrZero(e.puntos_visitante),
    form: (e.racha_partidos ?? [])
      .slice(0, 5)
      .map((r: any) => r.tipo as 'G' | 'E' | 'P')
      .filter((t: string) => t === 'G' || t === 'E' || t === 'P'),
  }));

  return { competition, group, round_number, round_date, entries };
}
