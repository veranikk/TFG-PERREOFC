/**
 * Scraper module that extracts calendar data from the source website.
 * It normalizes scraped page content before persistence code stores it in Supabase.
 */

import { withContext } from '../lib/browser.js';
import { parseDateDMY, parseTimeHM } from '../lib/normalize.js';

export interface ScrapedCalendar {
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
  rounds: Array<{
    round_number: number;
    round_date: string | null;
    matches: Array<{
      id: number;
      home_team_id: number;
      away_team_id: number;
      home_team_name: string;
      away_team_name: string;
      home_shield_url: string | null;
      away_shield_url: string | null;
      home_score: number | null;
      away_score: number | null;
      venue_id: number | null;
      venue_name: string | null;
      date: string;
      time: string | null;
    }>;
  }>;
}

export interface ScrapeCalendarParams {
  season_id: number;
  competition_id: number;
  group_id: number;
}

const BASE_URL = 'https://www.rffm.es/competicion/calendario';

export async function scrapeCalendar(p: ScrapeCalendarParams): Promise<ScrapedCalendar> {
  // Pasamos jornada=1 pero la respuesta trae TODAS las jornadas
  const params = new URLSearchParams({
    temporada: String(p.season_id),
    competicion: String(p.competition_id),
    grupo: String(p.group_id),
    jornada: '1',
    tipojuego: '1',
  });
  const url = `${BASE_URL}?${params.toString()}`;

  return withContext(async (ctx) => {
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const raw = await page.evaluate(() => {
      const el = document.getElementById('__NEXT_DATA__');
      return el?.textContent ? JSON.parse(el.textContent) : null;
    });

    const calendar = raw?.props?.pageProps?.calendar;
    if (!calendar || calendar.estado !== '1') {
      throw new Error(`Calendar comp=${p.competition_id} group=${p.group_id}: no disponible`);
    }

    return normalize(calendar, p);
  });
}

// ---------- Normalización ----------

function normalize(raw: any, p: ScrapeCalendarParams): ScrapedCalendar {
  const compName = trim(raw.competicion);
  const groupName = trim(raw.grupo);

  const competition: ScrapedCalendar['competition'] = {
    id: p.competition_id,
    name: compName,
    type: compName.toUpperCase().includes('COPA') ? 'copa' : 'liga',
    season_id: p.season_id,
  };

  const group: ScrapedCalendar['group'] = {
    id: p.group_id,
    competition_id: competition.id,
    name: groupName,
  };

  const rounds: ScrapedCalendar['rounds'] = (raw.rounds ?? []).map((r: any) => {
    const round_number = toInt(r.codjornada);
    // r.jornada viene como "1 (28-09-2025)" - extraemos la fecha
    const dateMatch = String(r.jornada ?? '').match(/\((\d{2}-\d{2}-\d{4})\)/);
    const round_date = dateMatch ? parseDateDMY(dateMatch[1]) : null;
    const matches = (r.equipos ?? [])
      .map((m: any) => mapMatch(m))
      .filter((m: any): m is NonNullable<typeof m> => m !== null);
    return { round_number, round_date, matches };
  });

  return { competition, group, rounds };
}

function mapMatch(m: any) {
  const date = parseDateDMY(m.fecha);
  if (!date) {
    console.warn(`[calendar] match ${m.codacta}: fecha inválida (${m.fecha}), saltando`);
    return null;
  }
  return {
    id: toInt(m.codacta),
    home_team_id: toInt(m.codigo_equipo_local),
    away_team_id: toInt(m.codigo_equipo_visitante),
    home_team_name: trim(m.equipo_local),
    away_team_name: trim(m.equipo_visitante),
    home_shield_url: trim(m.escudo_equipo_local) || null,
    away_shield_url: trim(m.escudo_equipo_visitante) || null,
    home_score: toIntOrNull(m.goles_casa),
    away_score: toIntOrNull(m.goles_visitante),
    venue_id: toIntOrNull(m.codigo_campo),
    venue_name: trim(m.campo) || null,
    date,
    time: parseTimeHM(m.hora),
  };
}

function trim(s: any): string {
  return typeof s === 'string' ? s.trim() : '';
}
function toInt(s: any): number {
  const n = parseInt(String(s), 10);
  if (Number.isNaN(n)) throw new Error(`No es entero: ${s}`);
  return n;
}
function toIntOrNull(s: any): number | null {
  if (s === null || s === undefined || s === '') return null;
  const n = parseInt(String(s), 10);
  return Number.isNaN(n) ? null : n;
}