/**
 * Scraper module that extracts team data from the source website.
 * It normalizes scraped page content before persistence code stores it in Supabase.
 */

import { withContext } from '../lib/browser.js';
import { trim, toInt, toIntOrNull, splitFullName } from '../lib/normalize.js';

export interface ScrapedTeam {
  team: {
    id: number;
    name: string;
    category: string | null;
    category_code: number | null;
    home_day: number | null;
    home_schedule: string | null;
  };
  club: {
    id: number;
    name: string;
    shield_url: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
    website: string | null;
  };
  venue: {
    id: number;
    name: string;
    photo_url: string | null;
  } | null;
  players: Array<{
    id: number;
    full_name: string;
    first_name: string | null;
    last_name: string | null;
    birth_year: number | null;
  }>;
  staff: Array<{
    id: number;
    full_name: string;
    role: 'entrenador' | 'segundo_entrenador' | 'delegado' | 'auxiliar';
  }>;
}

const BASE_URL = 'https://www.rffm.es/fichaequipo';

/** Scrapea ficha de equipo desde rffm.es y devuelve datos normalizados (team, club, venue, jugadores, staff). */
export async function scrapeTeam(teamId: number | string): Promise<ScrapedTeam> {
  const url = `${BASE_URL}/${teamId}`;

  return withContext(async (ctx) => {
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Extraer datos JSON embebidos en __NEXT_DATA__
    const raw = await page.evaluate(() => {
      const el = document.getElementById('__NEXT_DATA__');
      return el?.textContent ? JSON.parse(el.textContent) : null;
    });

    const team = raw?.props?.pageProps?.team;
    if (!team || team.estado !== '1') {
      throw new Error(`Team ${teamId}: datos no disponibles en rffm.es`);
    }

    return normalize(team);
  });
}

// ---------- Normalización ----------

function normalize(raw: any): ScrapedTeam {
  const codigo_campo = toIntOrNull(raw.codigo_campo);

  const venue = codigo_campo
    ? {
        id: codigo_campo,
        name: trim(raw.campo) || `Campo ${codigo_campo}`,
        photo_url: trim(raw.foto_campo) || null,
      }
    : null;

  return {
    team: {
      id: toInt(raw.codigo_equipo),
      name: trim(raw.nombre_equipo),
      category: trim(raw.categoria) || null,
      category_code: toIntOrNull(raw.codigo_categoria),
      home_day: toIntOrNull(raw.jugar_dia),
      home_schedule: trim(raw.jugar_horario) || null,
    },
    club: {
      id: toInt(raw.codigo_club),
      name: trim(raw.nombre_club),
      shield_url: trim(raw.escudo_club) || null,
      email: trim(raw.email_correspondencia) || null,
      phone: trim(raw.telefonos) || null,
      address: trim(raw.domicilio_correspondencia) || null,
      city: trim(raw.localidad_correspondencia) || null,
      province: trim(raw.provincia_correspondencia) || null,
      postal_code: trim(raw.codigo_postal_correspondencia) || null,
      website: trim(raw.portal_web) || null,
    },
    venue,
    players: (raw.jugadores_equipo ?? []).map((p: any) => {
      const full_name = trim(p.nombre);
      const { first_name, last_name } = splitFullName(full_name);
      return {
        id: toInt(p.cod_jugador),
        full_name,
        first_name,
        last_name,
        birth_year: toIntOrNull(p.anio_nacimiento),
      };
    }),
    staff: [
      ...(raw.tecnicos_equipo ?? []).map((s: any) => ({
        id: toInt(s.cod_tecnico),
        full_name: trim(s.nombre),
        role: 'entrenador' as const,
      })),
      ...(raw.delegados_equipo ?? []).map((s: any) => ({
        id: toInt(s.cod_delegado),
        full_name: trim(s.nombre),
        role: 'delegado' as const,
      })),
      ...(raw.auxiliares_equipo ?? []).map((s: any) => ({
        id: toInt(s.cod_auxiliar),
        full_name: trim(s.nombre),
        role: 'auxiliar' as const,
      })),
    ],
  };
}
