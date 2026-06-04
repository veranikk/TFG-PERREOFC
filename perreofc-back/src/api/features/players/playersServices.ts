/**
 * Contains the business and persistence logic for the players backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import { NotFoundError } from '../../errors.js';

/** Obtiene perfil completo del jugador: datos personales, equipo actual, estadísticas y últimos 5 partidos. */
export async function getPlayer(playerId: number, seasonId: number) {
  const supabase = getAdminClient();

  // Consultas paralelas para minimizar latencia
  const [playerRes, teamPlayerRes, statsRes, lineupsRes, profilePhotoRes] = await Promise.all([
    // Datos básicos del jugador
    supabase
      .from('players')
      .select('id, full_name, first_name, last_name, birth_year, photo_url, is_goalkeeper, position, position_code')
      .eq('id', playerId)
      .single(),
    // Equipo actual del jugador en esta temporada
    supabase
      .from('team_players')
      .select(`dorsal, position, team:teams(id, name)`)
      .eq('player_id', playerId)
      .eq('season_id', seasonId)
      .maybeSingle(),
    // Estadísticas de la temporada
    supabase
      .from('player_season_stats')
      .select('matches_called, matches_starting, matches_substitute, matches_played, goals_total, yellow_cards, red_cards, double_yellow_cards, minutes_total')
      .eq('player_id', playerId)
      .eq('season_id', seasonId)
      .maybeSingle(),
    // Últimos partidos del jugador (solo finalizados)
    supabase
      .from('match_lineup_entries')
      .select(`is_starter, match:matches!inner(id, date, home_team_name, away_team_name, home_score, away_score, status)`)
      .eq('player_id', playerId)
      .eq('match.status', 'finished')
      .limit(20),
    // Foto de perfil desde player_images (toma la marcada como is_profile=true)
    supabase
      .from('player_images' as any)
      .select('url')
      .eq('player_id', playerId)
      .eq('is_profile', true)
      .is('deleted_at', null)
      .maybeSingle(),
  ]);

  if (playerRes.error || !playerRes.data) throw new NotFoundError('Jugador no encontrado');

  // Ordenar lineups por fecha desc en JS y quedarnos con 5
  const lineups = (lineupsRes.data ?? [])
    .filter((l: any) => l.match?.date)
    .sort((a: any, b: any) => (b.match.date as string).localeCompare(a.match.date as string))
    .slice(0, 5);

  // Goles por partido
  const matchIds = lineups.map((l: any) => l.match.id);
  const goalsByMatch = new Map<number, number>();
  if (matchIds.length > 0) {
    const { data: goals } = await supabase
      .from('match_goals')
      .select('match_id')
      .eq('player_id', playerId)
      .in('match_id', matchIds);
    for (const g of goals ?? []) {
      goalsByMatch.set(g.match_id, (goalsByMatch.get(g.match_id) ?? 0) + 1);
    }
  }

  const stats = statsRes.data;
  const matchesPlayed = stats?.matches_played ?? 0;

  return {
    id: playerRes.data.id,
    fullName: playerRes.data.full_name,
    firstName: playerRes.data.first_name,
    lastName: playerRes.data.last_name,
    birthYear: playerRes.data.birth_year,
    photoUrl: (profilePhotoRes.data as any)?.url ?? playerRes.data.photo_url,
    isGoalkeeper: playerRes.data.is_goalkeeper,
    position: (playerRes.data as any).position ?? null,
    positionCode: (playerRes.data as any).position_code ?? null,
    currentTeam: teamPlayerRes.data?.team ? {
      id: (teamPlayerRes.data.team as any).id,
      name: (teamPlayerRes.data.team as any).name,
      dorsal: teamPlayerRes.data.dorsal,
      position: teamPlayerRes.data.position,
    } : null,
    stats: stats ? {
      matchesCalled: stats.matches_called,
      matchesStarting: stats.matches_starting,
      matchesSubstitute: stats.matches_substitute,
      matchesPlayed: stats.matches_played,
      goalsTotal: stats.goals_total,
      goalsAvg: matchesPlayed > 0 ? Number((stats.goals_total / matchesPlayed).toFixed(2)) : 0,
      minutesTotal: stats.minutes_total,
      minutesAvg: matchesPlayed > 0 ? Number((stats.minutes_total / matchesPlayed).toFixed(1)) : 0,
      yellowCards: stats.yellow_cards,
      redCards: stats.red_cards,
      doubleYellowCards: stats.double_yellow_cards,
    } : null,
    recentMatches: lineups.map((l: any) => ({
      matchId: l.match.id,
      date: l.match.date,
      homeTeamName: l.match.home_team_name,
      awayTeamName: l.match.away_team_name,
      score: `${l.match.home_score ?? '-'}-${l.match.away_score ?? '-'}`,
      isStarter: l.is_starter,
      goals: goalsByMatch.get(l.match.id) ?? 0,
    })),
  };
}

/** Obtiene estadísticas detalladas de un jugador por temporada. */
export async function getPlayerStatistics(playerId: number, seasonId: number) {
  const { NotFoundError } = await import('../../errors.js');
  const supabase = getAdminClient();

  const { data: stats, error } = await supabase
    .from('player_season_stats')
    .select('*')
    .eq('player_id', playerId)
    .eq('season_id', seasonId)
    .maybeSingle();

  if (error) throw error;
  if (!stats) throw new NotFoundError('Estadísticas del jugador no encontradas');

  const matchesPlayed = stats.matches_played ?? 0;

  return {
    playerId,
    seasonId,
    matchesCalled: stats.matches_called,
    matchesStarting: stats.matches_starting,
    matchesSubstitute: stats.matches_substitute,
    matchesPlayed: stats.matches_played,
    goalsTotal: stats.goals_total,
    goalsAvg: matchesPlayed > 0 ? Number((stats.goals_total / matchesPlayed).toFixed(2)) : 0,
    minutesTotal: stats.minutes_total,
    minutesAvg: matchesPlayed > 0 ? Number((stats.minutes_total / matchesPlayed).toFixed(1)) : 0,
    yellowCards: stats.yellow_cards,
    redCards: stats.red_cards,
    doubleYellowCards: stats.double_yellow_cards,
  };
}

/** Obtiene partidos jugados por un jugador con paginación. Incluye goles por partido. */
export async function getPlayerMatches(playerId: number, seasonId: number, page: number = 1, limit: number = 20) {
  const supabase = getAdminClient();
  const rangeFrom = (page - 1) * limit;
  const rangeTo = rangeFrom + limit - 1;

  const { data: lineups, error, count } = await supabase
    .from('match_lineup_entries')
    .select(`is_starter, match:matches!inner(id, date, home_team_name, away_team_name, home_score, away_score, status)`, { count: 'exact' })
    .eq('player_id', playerId)
    .order('date', { foreignTable: 'match', ascending: false })
    .range(rangeFrom, rangeTo);

  if (error) throw error;

  // Obtener goles para estos partidos
  const matchIds = (lineups ?? []).map((l: any) => l.match?.id).filter(Boolean);
  const goalsByMatch = new Map<number, number>();
  if (matchIds.length > 0) {
    const { data: goals } = await supabase
      .from('match_goals')
      .select('match_id')
      .eq('player_id', playerId)
      .in('match_id', matchIds);
    for (const g of goals ?? []) {
      goalsByMatch.set(g.match_id, (goalsByMatch.get(g.match_id) ?? 0) + 1);
    }
  }

  return {
    playerId,
    seasonId,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
    matches: (lineups ?? [])
      .filter((l: any) => l.match)
      .map((l: any) => ({
        matchId: l.match.id,
        date: l.match.date,
        homeTeamName: l.match.home_team_name,
        awayTeamName: l.match.away_team_name,
        score: `${l.match.home_score ?? '-'}-${l.match.away_score ?? '-'}`,
        status: l.match.status,
        isStarter: l.is_starter,
        goals: goalsByMatch.get(l.match.id) ?? 0,
      })),
  };
}




