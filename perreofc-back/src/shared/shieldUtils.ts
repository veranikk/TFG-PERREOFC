/**
 * Provides shared backend infrastructure for shield utils.
 * Utilities here are reused across features for configuration, clients, logging or validation.
 */

import { getAdminClient } from './supabase.js';

const RFFM_BASE = 'https://www.rffm.es';

/** Convierte URLs relativas de RFFM a absolutas. Fallback si no hay escudo en clubs. */
export function normalizeShieldUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith('/') ? `${RFFM_BASE}${url}` : url;
}

/**
 * Devuelve un mapa teamId → shield_url usando la tabla clubs (Supabase Storage).
 * Si un equipo no tiene escudo en clubs, el mapa no tendrá entrada para ese ID.
 */
export async function getClubShieldsByTeamIds(
  teamIds: number[],
): Promise<Map<number, string>> {
  const shieldMap = new Map<number, string>();
  if (teamIds.length === 0) return shieldMap;

  const supabase = getAdminClient();
  const { data } = await supabase
    .from('teams')
    .select('id, clubs!club_id(shield_url)')
    .in('id', teamIds);

  for (const row of (data ?? []) as any[]) {
    const shield: string | null | undefined = row.clubs?.shield_url;
    if (shield) shieldMap.set(row.id, shield);
  }

  return shieldMap;
}

/**
 * Resuelve el escudo de un equipo:
 *   1. URL de Supabase Storage (desde clubs)
 *   2. URL almacenada en el partido (normalizada si es relativa de RFFM)
 */
export function resolveShield(
  teamId: number | null | undefined,
  matchShieldUrl: string | null | undefined,
  clubShieldMap: Map<number, string>,
): string | null {
  if (teamId != null) {
    const fromClub = clubShieldMap.get(teamId);
    if (fromClub) return fromClub;
  }
  return normalizeShieldUrl(matchShieldUrl);
}
