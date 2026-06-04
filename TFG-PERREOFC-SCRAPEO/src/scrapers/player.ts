/**
 * Scraper module that extracts player data from the source website.
 * It normalizes scraped page content before persistence code stores it in Supabase.
 */

import { withContext } from '../lib/browser.js';
import { trim, toInt, toIntOrNull, toIntOrZero, splitFullName } from '../lib/normalize.js';

export interface ScrapedPlayer {
  player: {
    id: number;
    full_name: string;
    first_name: string | null;
    last_name: string | null;
    birth_year: number | null;
    photo_url: string | null;
    is_goalkeeper: boolean;
  };
  season_id: number;
  current_team_id: number | null;
  current_dorsal: number | null;
  current_position: string | null;
  competitions: Array<{
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
  }>;
  season_stats: {
    matches_called: number;
    matches_starting: number;
    matches_substitute: number;
    matches_played: number;
    goals_total: number;
    minutes_total: number;
    yellow_cards: number;
    red_cards: number;
    double_yellow_cards: number;
  };
}

const BASE_URL = 'https://www.rffm.es/fichajugador';

export async function scrapePlayer(playerId: number | string): Promise<ScrapedPlayer> {
  const url = `${BASE_URL}/${playerId}`;

  return withContext(async (ctx) => {
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const raw = await page.evaluate(() => {
      const el = document.getElementById('__NEXT_DATA__');
      return el?.textContent ? JSON.parse(el.textContent) : null;
    });

    const player = raw?.props?.pageProps?.player;
    if (!player || player.estado !== '1') {
      throw new Error(`Player ${playerId}: datos no disponibles`);
    }

    return normalize(player);
  });
}

// ---------- Normalización ----------

function normalize(raw: any): ScrapedPlayer {
  const full_name = trim(raw.nombre_jugador);
  const { first_name, last_name } = splitFullName(full_name);
  const season_id = toInt(raw.codigo_temporada);

  const player: ScrapedPlayer['player'] = {
    id: toInt(raw.codigo_jugador),
    full_name,
    first_name,
    last_name,
    birth_year: toIntOrNull(raw.anio_nacimiento),
    photo_url: trim(raw.foto) || null,
    is_goalkeeper: raw.es_portero === '1',
  };

  // Competitions del jugador (deduped por par competition+group)
  const compKey = (compId: number, groupId: number) => `${compId}:${groupId}`;
  const compMap = new Map<string, ScrapedPlayer['competitions'][number]>();

  for (const c of raw.competiciones_participa ?? []) {
    const compId = toInt(c.codigo_competicion);
    const groupId = toInt(c.codgrupo);
    const key = compKey(compId, groupId);
    if (compMap.has(key)) continue;

    const compName = trim(c.nombre_competicion);
    compMap.set(key, {
      competition: {
        id: compId,
        name: compName,
        type: compName.toUpperCase().includes('COPA') ? 'copa' : 'liga',
        season_id,
      },
      group: {
        id: groupId,
        competition_id: compId,
        name: trim(c.nombre_grupo),
      },
    });
  }

  // Stats agregadas indexadas por nombre
  const partidos: Record<string, number> = {};
  for (const p of raw.partidos ?? []) {
    partidos[trim(p.nombre)] = parseFloat(String(p.valor)) || 0;
  }
  const tarjetas: Record<string, number> = {};
  for (const t of raw.tarjetas ?? []) {
    tarjetas[trim(t.nombre)] = parseFloat(String(t.valor)) || 0;
  }

  const season_stats: ScrapedPlayer['season_stats'] = {
    matches_called: Math.round(partidos['Convocados'] ?? 0),
    matches_starting: Math.round(partidos['Titular'] ?? 0),
    matches_substitute: Math.round(partidos['Suplente'] ?? 0),
    matches_played: Math.round(partidos['Jugados'] ?? 0),
    goals_total: Math.round(partidos['Total Goles'] ?? 0),
    minutes_total: toIntOrZero(raw.minutos_totales_jugados),
    yellow_cards: Math.round(tarjetas['Amarillas'] ?? 0),
    red_cards: Math.round(tarjetas['Rojas'] ?? 0),
    double_yellow_cards: Math.round(tarjetas['Doble Amarilla'] ?? 0),
  };

  return {
    player,
    season_id,
    current_team_id: toIntOrNull(raw.codigo_equipo),
    current_dorsal: toIntOrNull(raw.dorsal_jugador),
    current_position: trim(raw.posicion_jugador) || null,
    competitions: [...compMap.values()],
    season_stats,
  };
}
