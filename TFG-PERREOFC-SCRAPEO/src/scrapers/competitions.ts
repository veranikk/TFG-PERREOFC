/**
 * Scraper module that extracts competitions data from the source website.
 * It normalizes scraped page content before persistence code stores it in Supabase.
 */

import { withContext } from '../lib/browser.js';
import {
  trim,
  toInt,
  toIntOrNull,
  parseDateDMY,
} from '../lib/normalize.js';

// ---------------------------------------------------------------------------
// Tipos de salida
// ---------------------------------------------------------------------------

export interface ScrapedSeason {
  id: number;         // cod_temporada
  name: string;       // "2025-2026"
  start_date: string; // "2025-07-01"
  end_date: string;   // "2026-06-30"
}

export interface ScrapedGameType {
  id: number;   // 1=F11 | 2=F7 | 3=Sala | 4=F5 | 5=Playa
  name: string; // "Futbol-11"
}

export interface ScrapedCompetition {
  id: number;
  name: string;
  game_type_id: number;
  game_type_name: string;
  category_id: number;
  category_name: string;
  group_category_id: number;
  group_category_name: string;
  competition_type: 1 | 2; // 1=copa/eliminatoria  2=liga
  is_active: boolean;
  start_date: string;
  end_date: string;
  order: number;
  points_win: number;
  points_draw: number;
  points_loss: number;
  match_minutes: number;
  num_parts: number;
  show_scorers: boolean;
  show_player_stats: boolean;
  show_standings: boolean;
}

export interface ScrapedGroup {
  id: number;
  name: string;          // "Grupo 1"
  competition_id: number;
  season_name: string;   // "2025-2026"
  competition_type: 1 | 2;
}

export interface ScrapedMatch {
  acta_id: number;
  round_number: number;
  round_id: number;
  group_id: number;
  competition_id: number;
  venue_id: number | null;
  venue_name: string | null;
  home_team_id: number;
  home_team_name: string;
  home_team_shield: string | null;
  away_team_id: number;
  away_team_name: string;
  away_team_shield: string | null;
  date: string | null;       // ISO "2025-09-14"
  time: string | null;       // "17:00"
  home_goals: number | null;
  away_goals: number | null;
}

export interface ScrapedCalendar {
  group: ScrapedGroup;
  matches: ScrapedMatch[];
}

// ---------------------------------------------------------------------------
// URLs
// ---------------------------------------------------------------------------

const BASE = 'https://www.rffm.es';
const RESULTS_URL = `${BASE}/competicion/resultados-y-jornadas`;
const CALENDAR_URL = `${BASE}/competicion/calendario`;

// ---------------------------------------------------------------------------
// scrapeSeasons
// Devuelve todas las temporadas y tipos de juego disponibles.
// ---------------------------------------------------------------------------

export async function scrapeSeasons(): Promise<{
  seasons: ScrapedSeason[];
  gameTypes: ScrapedGameType[];
}> {
  return withContext(async (ctx) => {
    const page = await ctx.newPage();
    await page.goto(RESULTS_URL, { waitUntil: 'domcontentloaded' });

    const pp = await extractNextData(page, RESULTS_URL);

    return {
      seasons: (pp.seasons ?? []).map(normalizeSeason),
      gameTypes: (pp.gameTypes ?? []).map(normalizeGameType),
    };
  });
}

// ---------------------------------------------------------------------------
// scrapeCompetitions
// Devuelve todas las competiciones de una temporada+tipo de juego.
// ---------------------------------------------------------------------------

export async function scrapeCompetitions(opts: {
  seasonId?: number;
  gameTypeId?: number;
} = {}): Promise<ScrapedCompetition[]> {
  const params = new URLSearchParams();
  if (opts.seasonId) params.set('temporada', String(opts.seasonId));
  if (opts.gameTypeId) params.set('tipojuego', String(opts.gameTypeId));

  const url = params.size ? `${RESULTS_URL}?${params}` : RESULTS_URL;

  return withContext(async (ctx) => {
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const pp = await extractNextData(page, url);
    const comps: any[] = pp.competitions ?? [];

    const filtered = opts.gameTypeId
      ? comps.filter((c) => String(c.codigo_tipo_juego) === String(opts.gameTypeId))
      : comps;

    return filtered.map(normalizeCompetition);
  });
}

// ---------------------------------------------------------------------------
// scrapeGroupsForCompetition
//
// Los grupos NO están en __NEXT_DATA__: son opciones MUI que se renderizan
// solo cuando se abre el dropdown GRUPO en el cliente.
//
// Estrategia:
//   1. Cargar /competicion/calendario?temporada=&tipojuego=&competicion=
//   2. Esperar domcontentloaded (networkidle es más lento y no añade fiabilidad aquí)
//   3. Clicar el último [role="button"][aria-haspopup="listbox"] (= GRUPO)
//      ⚠️ FRÁGIL: asume que el último MUI Select de la fila es siempre el de GRUPO.
//      Si rffm.es añade nuevos filtros, este índice cambiará.
//   4. Leer [role="option"] → { data-value: group_id, textContent: name }
//      ⚠️ FRÁGIL: depende del atributo data-value que MUI asigna a las opciones.
//      Si MUI cambia el DOM, el selector se rompe silenciosamente.
// ---------------------------------------------------------------------------

export async function scrapeGroupsForCompetition(opts: {
  seasonId: number;
  gameTypeId: number;
  competitionId: number;
}): Promise<Array<{ id: number; name: string }>> {
  const params = new URLSearchParams({
    temporada: String(opts.seasonId),
    tipojuego: String(opts.gameTypeId),
    competicion: String(opts.competitionId),
  });
  const url = `${CALENDAR_URL}?${params}`;

  return withContext(async (ctx) => {
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await dismissConsentOverlay(page);

    const selects = page.locator('[role="button"][aria-haspopup="listbox"]').filter({
      visible: true,
    });
    const selectCount = await selects.count();

    if (!selectCount) {
      throw new Error(
        `scrapeGroupsForCompetition: dropdown GRUPO no encontrado (competicion=${opts.competitionId})`
      );
    }

    // El select de GRUPO es el ultimo MUI Select visible de la fila de filtros.
    await selects.nth(selectCount - 1).click();
    await page.locator('[role="option"]').first().waitFor({ state: 'visible', timeout: 15000 });

    const groups = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).map((el) => ({
        id: el.dataset.value ?? '',
        name: el.textContent?.trim() ?? '',
      }))
    );

    if (!groups.length) {
      throw new Error(
        `scrapeGroupsForCompetition: dropdown abierto pero vacío (competicion=${opts.competitionId})`
      );
    }

    return groups
      .filter((g) => g.id !== '')
      .map((g) => ({ id: toInt(g.id), name: g.name }));
  });
}

// ---------------------------------------------------------------------------
// scrapeCalendar
// Jornadas + partidos de UN grupo concreto.
// ---------------------------------------------------------------------------

export async function scrapeCalendar(opts: {
  seasonId: number;
  gameTypeId: number;
  competitionId: number;
  groupId: number;
}): Promise<ScrapedCalendar> {
  const params = new URLSearchParams({
    temporada: String(opts.seasonId),
    tipojuego: String(opts.gameTypeId),
    competicion: String(opts.competitionId),
    grupo: String(opts.groupId),
  });
  const url = `${CALENDAR_URL}?${params}`;

  return withContext(async (ctx) => {
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const pp = await extractNextData(page, url);

    if (!pp.calendar) {
      throw new Error(
        `scrapeCalendar: sin datos (competicion=${opts.competitionId} grupo=${opts.groupId})`
      );
    }

    const cal = pp.calendar;

    const group: ScrapedGroup = {
      id: opts.groupId,
      name: trim(cal.grupo) || `Grupo ${opts.groupId}`,
      competition_id: opts.competitionId,
      season_name: trim(cal.temporada),
      competition_type: (parseInt(cal.tipo_competicion, 10) || 2) as 1 | 2,
    };

    const matches: ScrapedMatch[] = (cal.rounds ?? []).flatMap((round: any) =>
      (round.equipos ?? []).map((m: any) => normalizeMatch(m, round, group))
    );

    return { group, matches };
  });
}

// ---------------------------------------------------------------------------
// scrapeAllCalendars  (helper de alto nivel)
// ---------------------------------------------------------------------------

export async function scrapeAllCalendars(opts: {
  seasonId: number;
  gameTypeId: number;
  onlyActive?: boolean;
}): Promise<{
  competitions: ScrapedCompetition[];
  calendars: ScrapedCalendar[];
  errors: Array<{ competitionId: number; groupId?: number; error: string }>;
}> {
  const competitions = await scrapeCompetitions({
    seasonId: opts.seasonId,
    gameTypeId: opts.gameTypeId,
  });

  const active =
    opts.onlyActive !== false ? competitions.filter((c) => c.is_active) : competitions;

  const calendars: ScrapedCalendar[] = [];
  const errors: Array<{ competitionId: number; groupId?: number; error: string }> = [];

  for (const comp of active) {
    let groups: Array<{ id: number; name: string }>;

    try {
      groups = await scrapeGroupsForCompetition({
        seasonId: opts.seasonId,
        gameTypeId: opts.gameTypeId,
        competitionId: comp.id,
      });
    } catch (err: any) {
      errors.push({ competitionId: comp.id, error: err.message });
      continue;
    }

    for (const group of groups) {
      try {
        const cal = await scrapeCalendar({
          seasonId: opts.seasonId,
          gameTypeId: opts.gameTypeId,
          competitionId: comp.id,
          groupId: group.id,
        });
        calendars.push(cal);
      } catch (err: any) {
        errors.push({ competitionId: comp.id, groupId: group.id, error: err.message });
      }
    }
  }

  return { competitions, calendars, errors };
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

async function extractNextData(page: any, url: string): Promise<any> {
  const raw = await page.evaluate(() => {
    const el = document.getElementById('__NEXT_DATA__');
    return el?.textContent ? JSON.parse(el.textContent) : null;
  });
  if (!raw?.props?.pageProps) {
    throw new Error(`__NEXT_DATA__ no encontrado en ${url}`);
  }
  return raw.props.pageProps;
}

// Elimina el overlay de consentimiento de cookies de Quantcast (CMP v2).
// El overlay bloquea los clics cuando está presente, impidiendo abrir el dropdown de grupos.
// Estrategia de dos pasos:
//   1. Intentar clic en el botón "Aceptar" (3s timeout — falla silenciosamente si no aparece).
//   2. Si falla, eliminar el overlay del DOM directamente via evaluate.
//      Esto es seguro porque el evaluate solo actúa sobre el DOM local del contexto aislado,
//      no sobre datos del servidor, y los IDs (#qc-cmp2-container) son del proveedor de CMP.
// ⚠️ FRÁGIL: si rffm.es cambia de proveedor de CMP, los selectores CSS quedarán obsoletos.
async function dismissConsentOverlay(page: any): Promise<void> {
  const consentButton = page
    .getByRole('button', { name: /aceptar|accept|agree|consentir|estoy de acuerdo/i })
    .first();

  try {
    await consentButton.click({ timeout: 3000 });
    return;
  } catch {
    // Quantcast sometimes renders above the page without an easily stable button label.
  }

  await page.evaluate(() => {
    document.querySelectorAll('#qc-cmp2-container, .qc-cmp-cleanslate').forEach((el) => {
      el.remove();
    });
    document.body.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('overflow');
  });
}

// ---------------------------------------------------------------------------
// Normalizadores
// ---------------------------------------------------------------------------

function normalizeSeason(raw: any): ScrapedSeason {
  return {
    id: toInt(raw.cod_temporada),
    name: trim(raw.nombre),
    start_date: trim(raw.fecha_inicio),
    end_date: trim(raw.fecha_fin),
  };
}

function normalizeGameType(raw: any): ScrapedGameType {
  return {
    id: toInt(raw.codigo_tipo_juego),
    name: trim(raw.nombre),
  };
}

function normalizeCompetition(raw: any): ScrapedCompetition {
  return {
    id: toInt(raw.codigo),
    name: trim(raw.nombre),
    game_type_id: toInt(raw.codigo_tipo_juego),
    game_type_name: trim(raw.TipoJuego),
    category_id: toInt(raw.CodigoCategoria),
    category_name: trim(raw.NombreCategoria),
    group_category_id: toInt(raw.cod_grupo_categoria),
    group_category_name: trim(raw.nombre_grupo_categoria),
    competition_type: (parseInt(raw.tipo_competicion, 10) || 2) as 1 | 2,
    is_active: raw.Activa === '1',
    start_date: trim(raw.FechaInicio),
    end_date: trim(raw.FechaFin),
    order: toInt(raw.Orden),
    points_win: toInt(raw.ptos_ganado),
    points_draw: toInt(raw.ptos_empatado),
    points_loss: toInt(raw.ptos_perdido),
    match_minutes: toInt(raw.minutos_juego),
    num_parts: toInt(raw.numero_partes),
    show_scorers: raw.goleadores === '1',
    show_player_stats: raw.ver_estadisticas_jugador === '1',
    show_standings: raw.visible_clasificacion === '1',
  };
}

function normalizeMatch(raw: any, round: any, group: ScrapedGroup): ScrapedMatch {
  return {
    acta_id: toInt(raw.codacta),
    round_number: toInt(round.jornada),
    round_id: toInt(round.codjornada),
    group_id: group.id,
    competition_id: group.competition_id,
    venue_id: toIntOrNull(raw.codigo_campo),
    venue_name: trim(raw.campo) || null,
    home_team_id: toInt(raw.codigo_equipo_local),
    home_team_name: trim(raw.equipo_local),
    home_team_shield: trim(raw.escudo_equipo_local) || null,
    away_team_id: toInt(raw.codigo_equipo_visitante),
    away_team_name: trim(raw.equipo_visitante),
    away_team_shield: trim(raw.escudo_equipo_visitante) || null,
    date: parseDateDMY(trim(raw.fecha)),
    time: trim(raw.hora) || null,
    home_goals: parseGoals(raw.goles_casa),
    away_goals: parseGoals(raw.goles_visitante),
  };
}

// ---------------------------------------------------------------------------
// Utilidades locales
// ---------------------------------------------------------------------------

function parseGoals(s: any): number | null {
  const str = String(s ?? '').trim();
  if (!str) return null;
  const n = parseInt(str, 10);
  return Number.isNaN(n) ? null : n;
}
