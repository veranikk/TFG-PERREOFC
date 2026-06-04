/**
 * Scraper module that extracts match data from the source website.
 * It normalizes scraped page content before persistence code stores it in Supabase.
 */

import { withContext } from '../lib/browser.js';
import {
  trim,
  toInt,
  toIntOrNull,
  splitFullName,
  parseDateDMY,
  parseTimeHM,
} from '../lib/normalize.js';

export interface ScrapedMatch {
  match: {
    id: number;
    home_team_id: number;
    away_team_id: number;
    home_team_name: string;
    away_team_name: string;
    home_shield_url: string | null;
    away_shield_url: string | null;
    home_score: number | null;
    away_score: number | null;
    home_penalty_score: number | null;
    away_penalty_score: number | null;
    status: 'upcoming' | 'live' | 'finished' | 'suspended';
    is_closed: boolean;
    is_suspended: boolean;
    date: string;       // YYYY-MM-DD
    time: string | null; // HH:MM
    venue_id: number | null;
    venue_name: string | null;
    home_formation: string | null;
    away_formation: string | null;
    home_delegate: string | null;
    home_coach_id: number | null;
    home_coach_name: string | null;
    away_coach_id: number | null;
    away_coach_name: string | null;
  };
  venue: { id: number; name: string } | null;
  lineups: Array<{
    side: 'home' | 'away';
    player_id: number;
    player_name: string;
    first_name: string | null;
    last_name: string | null;
    dorsal: number | null;
    is_starter: boolean;
    is_substitute: boolean;
    is_captain: boolean;
    is_goalkeeper: boolean;
    position: string | null;
  }>;
  goals: Array<{
    side: 'home' | 'away';
    player_id: number;
    player_name: string;
    minute: number;
    goal_type_code: number;
  }>;
  cards: Array<{
    side: 'home' | 'away';
    player_id: number;
    player_name: string;
    minute: number | null;
    card_type_code: number; // 100=amarilla, 101=roja, 102=doble amarilla
  }>;
  staffEntries: Array<{
    side: 'home' | 'away';
    staff_id: number;
    staff_name: string;
    role_description: string | null;
  }>;
}

const BASE_URL = 'https://www.rffm.es/acta-partido';

export async function scrapeMatch(codacta: number | string): Promise<ScrapedMatch> {
  const url = `${BASE_URL}/${codacta}`;

  return withContext(async (ctx) => {
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const raw = await page.evaluate(() => {
      const el = document.getElementById('__NEXT_DATA__');
      return el?.textContent ? JSON.parse(el.textContent) : null;
    });

    const game = raw?.props?.pageProps?.game;
    if (!game || game.estado !== '1') {
      throw new Error(`Match ${codacta}: datos no disponibles`);
    }

    return normalize(game);
  });
}

// ---------- Normalización ----------

function normalize(raw: any): ScrapedMatch {
  const venueId = toIntOrNull(raw.codigo_campo);
  const homeId = toInt(raw.codigo_equipo_local);
  const awayId = toInt(raw.codigo_equipo_visitante);

  const status = computeStatus(raw);

  const match: ScrapedMatch['match'] = {
    id: toInt(raw.codacta),
    home_team_id: homeId,
    away_team_id: awayId,
    home_team_name: trim(raw.equipo_local),
    away_team_name: trim(raw.equipo_visitante),
    home_shield_url: trim(raw.escudo_local) || null,
    away_shield_url: trim(raw.escudo_visitante) || null,
    home_score: toIntOrNull(raw.goles_local),
    away_score: toIntOrNull(raw.goles_visitante),
    home_penalty_score: toIntOrNull(raw.penaltis_casa),
    away_penalty_score: toIntOrNull(raw.penaltis_fuera),
    status,
    is_closed: raw.acta_cerrada === '1',
    is_suspended: raw.suspendido === '1',
    date: parseDateDMY(raw.fecha) ?? '',
    time: parseTimeHM(raw.hora),
    venue_id: venueId,
    venue_name: trim(raw.campo) || null,
    home_formation: trim(raw.esquema_local) || null,
    away_formation: trim(raw.esquema_visitante) || null,
    home_delegate: trim(raw.delegadolocal) || null,
    home_coach_id: toIntOrNull(raw.cod_entrenador_local),
    home_coach_name: trim(raw.entrenador_local) || null,
    away_coach_id: toIntOrNull(raw.cod_entrenador_visitante),
    away_coach_name: trim(raw.entrenador_visitante) || null,
  };

  if (!match.date) {
    throw new Error(`Match ${match.id}: fecha inválida (${raw.fecha})`);
  }

  const venue = venueId ? { id: venueId, name: trim(raw.campo) || `Campo ${venueId}` } : null;

  const lineups: ScrapedMatch['lineups'] = [
    ...(raw.jugadores_equipo_local ?? []).map((p: any) => mapLineup(p, 'home')),
    ...(raw.jugadores_equipo_visitante ?? []).map((p: any) => mapLineup(p, 'away')),
  ];

  const goals: ScrapedMatch['goals'] = [
    ...(raw.goles_equipo_local ?? []).map((g: any) => mapGoal(g, 'home')),
    ...(raw.goles_equipo_visitante ?? []).map((g: any) => mapGoal(g, 'away')),
  ];

  const cards: ScrapedMatch['cards'] = [
    ...(raw.tarjetas_equipo_local ?? []).map((c: any) => mapCard(c, 'home')),
    ...(raw.tarjetas_equipo_visitante ?? []).map((c: any) => mapCard(c, 'away')),
  ];

  const staffEntries: ScrapedMatch['staffEntries'] = [
    ...(raw.otros_tecnicos_local ?? []).map((s: any) => mapStaff(s, 'home')),
    ...(raw.otros_tecnicos_visitante ?? []).map((s: any) => mapStaff(s, 'away')),
  ];

  return { match, venue, lineups, goals, cards, staffEntries };
}

function computeStatus(raw: any): ScrapedMatch['match']['status'] {
  if (raw.suspendido === '1') return 'suspended';
  if (raw.acta_cerrada === '1') return 'finished';
  if (raw.partido_en_juego === '1') return 'live';
  return 'upcoming';
}

function mapLineup(p: any, side: 'home' | 'away'): ScrapedMatch['lineups'][number] {
  const player_name = trim(p.nombre_jugador);
  const { first_name, last_name } = splitFullName(player_name);
  return {
    side,
    player_id: toInt(p.codjugador),
    player_name,
    first_name,
    last_name,
    dorsal: toIntOrNull(p.dorsal),
    is_starter: p.titular === '1',
    is_substitute: p.suplente === '1',
    is_captain: p.capitan === '1',
    is_goalkeeper: p.portero === '1',
    position: trim(p.posicion) || null,
  };
}

function mapGoal(g: any, side: 'home' | 'away'): ScrapedMatch['goals'][number] {
  return {
    side,
    player_id: toInt(g.codjugador),
    player_name: trim(g.nombre_jugador),
    minute: toInt(g.minuto),
    goal_type_code: toInt(g.tipo_gol),
  };
}

function mapCard(c: any, side: 'home' | 'away'): ScrapedMatch['cards'][number] {
  // 100 = amarilla, 101 = roja directa, doble amarilla = 102
  let card_type_code = toInt(c.codigo_tipo_amonestacion);
  if (card_type_code === 100 && c.segunda_amarilla === '1') {
    card_type_code = 102;
  }
  return {
    side,
    player_id: toInt(c.codjugador),
    player_name: trim(c.nombre_jugador),
    minute: toIntOrNull(c.minuto),
    card_type_code,
  };
}

function mapStaff(s: any, side: 'home' | 'away'): ScrapedMatch['staffEntries'][number] {
  return {
    side,
    staff_id: toInt(s.cod_tecnico),
    staff_name: trim(s.nombre),
    role_description: trim(s.tipo) || null,
  };
}
