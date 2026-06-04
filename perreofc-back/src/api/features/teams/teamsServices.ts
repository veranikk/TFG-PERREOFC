/**
 * Contains the business and persistence logic for the teams backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import { NotFoundError } from '../../errors.js';
import { getClubShieldsByTeamIds, resolveShield } from '../../../shared/shieldUtils.js';

export async function getTeamKits(teamId: number) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('kit_designs')
    .select('kit_number, shirt1, shirt1_hex, shirt2, shirt2_hex, short1, short1_hex, short2, short2_hex, socks, socks_hex')
    .eq('team_id', teamId)
    .order('kit_number');
  if (error) throw error;
  return (data ?? []).map((k: any) => ({
    kitNumber:  k.kit_number,
    shirt1:     k.shirt1     ?? null,
    shirt1Hex:  k.shirt1_hex ?? null,
    shirt2:     k.shirt2     ?? null,
    shirt2Hex:  k.shirt2_hex ?? null,
    short1:     k.short1     ?? null,
    short1Hex:  k.short1_hex ?? null,
    short2:     k.short2     ?? null,
    short2Hex:  k.short2_hex ?? null,
    socks:      k.socks      ?? null,
    socksHex:   k.socks_hex  ?? null,
  }));
}

export async function getTeamSquad(teamId: number, seasonId: number) {
  const supabase = getAdminClient();

  // 1. Equipo
  const { data: team, error: teamErr } = await supabase
    .from('teams')
    .select('id, name')
    .eq('id', teamId)
    .single();
  if (teamErr || !team) throw new NotFoundError('Equipo no encontrado');

  // 2. team_players con datos del jugador
  const { data: tps, error: tpsErr } = await supabase
    .from('team_players')
    .select(`dorsal, position, player:players(id, full_name, first_name, last_name, birth_year, photo_url, is_goalkeeper, position, position_code)`)
    .eq('team_id', teamId)
    .eq('season_id', seasonId);
  if (tpsErr) throw tpsErr;

  // 3. Stats de esos jugadores en esta season (query separada)
  const playerIds = (tps ?? []).map((tp: any) => tp.player.id);
  const statsByPlayer = new Map<number, any>();
  const profilePhotoByPlayer = new Map<number, string>();
  if (playerIds.length > 0) {
    const [statsResult, photosResult] = await Promise.all([
      supabase
        .from('player_season_stats')
        .select('player_id, matches_called, matches_starting, matches_substitute, matches_played, goals_total, yellow_cards, red_cards, minutes_total')
        .eq('season_id', seasonId)
        .in('player_id', playerIds),
      supabase
        .from('player_images' as any)
        .select('player_id, url')
        .in('player_id', playerIds)
        .eq('is_profile', true)
        .is('deleted_at', null),
    ]);
    if (statsResult.error) throw statsResult.error;
    for (const s of statsResult.data ?? []) statsByPlayer.set(s.player_id, s);
    for (const img of (photosResult.data ?? []) as any[]) profilePhotoByPlayer.set(img.player_id, img.url);
  }

  // 4. Staff
  const { data: staff, error: staffErr } = await supabase
    .from('team_staff')
    .select(`role, role_description, staff:staff_members(id, full_name, photo_url)`)
    .eq('team_id', teamId)
    .eq('season_id', seasonId);
  if (staffErr) throw staffErr;

  return {
    teamId: team.id,
    teamName: team.name,
    seasonId,
    players: (tps ?? []).map((tp: any) => {
      const s = statsByPlayer.get(tp.player.id);
      return {
        id: tp.player.id,
        fullName: tp.player.full_name,
        firstName: tp.player.first_name,
        lastName: tp.player.last_name,
        birthYear: tp.player.birth_year,
        photoUrl: profilePhotoByPlayer.get(tp.player.id) ?? tp.player.photo_url ?? null,
        isGoalkeeper: tp.player.is_goalkeeper,
        dorsal: tp.dorsal,
        position: tp.position ?? (tp.player as any).position ?? null,
        positionCode: (tp.player as any).position_code ?? null,
        stats: s ? {
          matchesCalled: s.matches_called,
          matchesStarting: s.matches_starting,
          matchesSubstitute: s.matches_substitute,
          matchesPlayed: s.matches_played,
          goalsTotal: s.goals_total,
          yellowCards: s.yellow_cards,
          redCards: s.red_cards,
          minutesTotal: s.minutes_total,
        } : null,
      };
    }),
    staff: (staff ?? []).map((ts: any) => ({
      id: ts.staff.id,
      fullName: ts.staff.full_name,
      photoUrl: ts.staff.photo_url,
      role: ts.role,
      roleDescription: ts.role_description,
    })),
  };
}

export async function getTeamById(teamId: number) {
  const supabase = getAdminClient();

  const { data: team, error } = await supabase
    .from('teams')
    .select('id, name, category, home_venue_id, club:clubs(id, name, shield_url, email, phone, address, city, province, postal_code, website)')
    .eq('id', teamId)
    .single();

  if (error || !team) throw new NotFoundError('Equipo no encontrado');

  return {
    id: team.id,
    name: team.name,
    category: team.category,
    homeVenueId: team.home_venue_id,
    club: team.club
      ? {
          id: (team.club as any).id,
          name: (team.club as any).name,
          shieldUrl: (team.club as any).shield_url,
          email: (team.club as any).email,
          phone: (team.club as any).phone,
          address: (team.club as any).address,
          city: (team.club as any).city,
          province: (team.club as any).province,
          postalCode: (team.club as any).postal_code,
          website: (team.club as any).website,
        }
      : null,
  };
}

export async function getTeamMatches(teamId: number, seasonId: number, page: number = 1, limit: number = 20) {
  const supabase = getAdminClient();
  const rangeFrom = (page - 1) * limit;
  const rangeTo = rangeFrom + limit - 1;

  const { data: matches, error, count } = await supabase
    .from('matches')
    .select('*', { count: 'exact' })
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .order('date', { ascending: false })
    .order('time', { ascending: false })
    .range(rangeFrom, rangeTo);

  if (error) throw error;

  // Resolver escudos desde clubs (Supabase Storage)
  const teamIds = [
    ...(matches ?? []).map((m) => m.home_team_id),
    ...(matches ?? []).map((m) => m.away_team_id),
  ].filter((id): id is number => id != null);
  const clubShields = await getClubShieldsByTeamIds([...new Set(teamIds)]);

  return {
    teamId,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
    matches: (matches ?? []).map((m) => ({
      id: m.id,
      homeTeamId: m.home_team_id,
      homeTeamName: m.home_team_name,
      homeShieldUrl: resolveShield(m.home_team_id, m.home_shield_url, clubShields),
      awayTeamId: m.away_team_id,
      awayTeamName: m.away_team_name,
      awayShieldUrl: resolveShield(m.away_team_id, m.away_shield_url, clubShields),
      homeScore: m.home_score,
      awayScore: m.away_score,
      status: m.status,
      date: m.date,
      time: m.time,
      venueId: m.venue_id,
      venueName: m.venue_name,
    })),
  };
}

export async function getTeamStatistics(teamId: number, seasonId: number) {
  const supabase = getAdminClient();

  // Obtener todos los jugadores del equipo en esta temporada
  const { data: players, error: playersError } = await supabase
    .from('team_players')
    .select('player_id')
    .eq('team_id', teamId)
    .eq('season_id', seasonId);

  if (playersError) throw playersError;

  const playerIds = (players ?? []).map((p) => p.player_id);
  if (playerIds.length === 0) {
    return {
      teamId,
      seasonId,
      statistics: {
        totalPlayers: 0,
        totalMatchesParticipated: 0,
        totalGoals: 0,
        totalYellowCards: 0,
        totalRedCards: 0,
        totalMinutes: 0,
      },
    };
  }

  // Agregar stats
  const { data: stats, error: statsError } = await supabase
    .from('player_season_stats')
    .select('*')
    .eq('season_id', seasonId)
    .in('player_id', playerIds);

  if (statsError) throw statsError;

  const aggregated = (stats ?? []).reduce(
    (acc, s) => {
      acc.totalMatchesParticipated += s.matches_played ?? 0;
      acc.totalGoals += s.goals_total ?? 0;
      acc.totalYellowCards += s.yellow_cards ?? 0;
      acc.totalRedCards += s.red_cards ?? 0;
      acc.totalMinutes += s.minutes_total ?? 0;
      return acc;
    },
    {
      totalMatchesParticipated: 0,
      totalGoals: 0,
      totalYellowCards: 0,
      totalRedCards: 0,
      totalMinutes: 0,
    },
  );

  return {
    teamId,
    seasonId,
    statistics: {
      totalPlayers: playerIds.length,
      ...aggregated,
    },
  };
}

export async function getTeamGroupId(teamId: number) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('classification_entries')
    .select('group_id')
    .eq('team_id', teamId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.group_id;
}




