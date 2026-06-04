/**
 * Contains the business and persistence logic for the matches backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import { NotFoundError } from '../../errors.js';
import { getGroupHeader } from '../groups/groupsServices.js';
import { getClubShieldsByTeamIds, resolveShield } from '../../../shared/shieldUtils.js';

type MatchRow = Awaited<ReturnType<typeof fetchMatchesForGroup>>[number];

function groupMatchesByRound(matches: MatchRow[]) {
  const byRound = new Map<number, MatchRow[]>();

  for (const match of matches) {
    const roundNumber = match.round_number ?? 0;
    const roundMatches = byRound.get(roundNumber) ?? [];
    roundMatches.push(match);
    byRound.set(roundNumber, roundMatches);
  }

  return [...byRound.entries()]
    .sort(([a], [b]) => a - b)
    .map(([round_number, roundMatches]) => ({
      round_number,
      matches: roundMatches,
    }));
}

async function fetchMatchesForGroup(params: {
  groupId: number;
  roundNumber?: number;
  page?: number;
  limit?: number;
}) {
  const supabase = getAdminClient();
  let query = supabase
    .from('matches')
    .select('*', { count: 'exact' })
    .eq('group_id', params.groupId)
    .order('round_number', { ascending: true })
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (params.roundNumber !== undefined) {
    query = query.eq('round_number', params.roundNumber);
  } else if (params.page !== undefined && params.limit !== undefined) {
    const from = (params.page - 1) * params.limit;
    query = query.range(from, from + params.limit - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return Object.assign(data ?? [], { total: count ?? 0 });
}

export async function getGroupMatches(params: {
  groupId: number;
  roundNumber?: number;
  page: number;
  limit: number;
}) {
  const group = await getGroupHeader(params.groupId);
  const matches = await fetchMatchesForGroup({
    groupId: params.groupId,
    roundNumber: params.roundNumber,
    page: params.roundNumber === undefined ? params.page : undefined,
    limit: params.roundNumber === undefined ? params.limit : undefined,
  });

  const response: {
    group: typeof group;
    rounds: ReturnType<typeof groupMatchesByRound>;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } = {
    group,
    rounds: groupMatchesByRound(matches),
  };

  if (params.roundNumber === undefined) {
    response.pagination = {
      page: params.page,
      limit: params.limit,
      total: matches.total,
      totalPages: Math.ceil(matches.total / params.limit),
    };
  }

  return response;
}

export async function getCurrentGroupRoundMatches(groupId: number) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('matches')
    .select('round_number')
    .eq('group_id', groupId)
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return getGroupMatches({
    groupId,
    roundNumber: data?.round_number ?? 1,
    page: 1,
    limit: 50,
  });
}

export async function getMatchById(matchId: number) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new NotFoundError('Partido no encontrado');

  // Enriquecer con escudos desde clubs (Supabase Storage)
  const teamIds = [data.home_team_id, data.away_team_id].filter((id): id is number => id != null);
  const clubShields = await getClubShieldsByTeamIds(teamIds);

  return {
    ...data,
    home_shield_url: resolveShield(data.home_team_id, data.home_shield_url, clubShields),
    away_shield_url: resolveShield(data.away_team_id, data.away_shield_url, clubShields),
  };
}

export async function getMatchLineups(matchId: number) {
  const supabase = getAdminClient();

  // Verificar que el partido existe
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id')
    .eq('id', matchId)
    .single();

  if (matchError || !match) throw new NotFoundError('Partido no encontrado');

  // Obtener alineaciones agrupadas por side (home/away)
  const { data: lineups, error } = await supabase
    .from('match_lineup_entries')
    .select('*')
    .eq('match_id', matchId)
    .order('side', { ascending: true })
    .order('is_starter', { ascending: false })
    .order('dorsal', { ascending: true });

  if (error) throw error;

  // Enriquecer posición desde players para todos los jugadores con player_id
  // (match_lineup_entries.position puede estar vacío aunque el jugador tenga posición en DB)
  const allPlayerIds = (lineups ?? [])
    .filter((l) => l.player_id)
    .map((l) => l.player_id as number);

  const positionMap = new Map<number, string>();
  if (allPlayerIds.length > 0) {
    const { data: playerRows } = await supabase
      .from('players')
      .select('id, position, position_code, is_goalkeeper')
      .in('id', allPlayerIds) as {
        data: { id: number; position: string | null; position_code: string | null; is_goalkeeper: boolean }[] | null
      };
    for (const pr of playerRows ?? []) {
      const pos = pr.position ?? pr.position_code ?? (pr.is_goalkeeper ? 'Portero' : null);
      if (pos) positionMap.set(pr.id, pos);
    }
  }

  const homePlayers = (lineups ?? []).filter((l) => l.side === 'home');
  const awayPlayers = (lineups ?? []).filter((l) => l.side === 'away');

  const formatPlayers = (players: typeof lineups) =>
    players.map((p) => ({
      id: p.id,
      playerId: p.player_id,
      playerName: p.player_name,
      dorsal: p.dorsal,
      isStarter: p.is_starter,
      isSubstitute: p.is_substitute,
      isCaptain: p.is_captain,
      isGoalkeeper: p.is_goalkeeper || (p.player_id ? (positionMap.get(p.player_id) ?? '').toLowerCase().includes('portero') : false),
      position: (p.player_id ? positionMap.get(p.player_id) : null) ?? p.position ?? null,
      posX: p.pos_x,
      posY: p.pos_y,
    }));

  return {
    matchId,
    home: { players: formatPlayers(homePlayers) },
    away: { players: formatPlayers(awayPlayers) },
  };
}

export async function getMatchEvents(matchId: number) {
  const supabase = getAdminClient();

  // Verificar que el partido existe
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id')
    .eq('id', matchId)
    .single();

  if (matchError || !match) throw new NotFoundError('Partido no encontrado');

  // Obtener goles y tarjetas en paralelo
  const [goalsRes, cardsRes] = await Promise.all([
    supabase.from('match_goals').select('*').eq('match_id', matchId),
    supabase.from('match_cards').select('*').eq('match_id', matchId),
  ]);

  if (goalsRes.error) throw goalsRes.error;
  if (cardsRes.error) throw cardsRes.error;

  const goals = (goalsRes.data ?? []).map((g) => ({
    type: 'goal',
    minute: g.minute,
    side: g.side,
    playerId: g.player_id,
    playerName: g.player_name,
    goalType: g.goal_type_code,
    isOwnGoal: g.is_own_goal,
  }));

  const cards = (cardsRes.data ?? []).map((c) => ({
    type: 'card',
    minute: c.minute,
    side: c.side,
    playerId: c.player_id,
    playerName: c.player_name,
    cardType: c.card_type_code,
  }));

  // Combinar y ordenar por minuto
  const events = [...goals, ...cards].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));

  return {
    matchId,
    events,
  };
}

export async function getMatchStats(matchId: number) {
  const supabase = getAdminClient();

  // Verificar que el partido existe
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (matchError || !match) throw new NotFoundError('Partido no encontrado');

  // Obtener goles y tarjetas
  const [goalsRes, cardsRes] = await Promise.all([
    supabase.from('match_goals').select('*').eq('match_id', matchId),
    supabase.from('match_cards').select('*').eq('match_id', matchId),
  ]);

  if (goalsRes.error) throw goalsRes.error;
  if (cardsRes.error) throw cardsRes.error;

  const goals = goalsRes.data ?? [];
  const cards = cardsRes.data ?? [];

  // Aggregate stats
  const homeGoals = goals.filter((g) => g.side === 'home' && !g.is_own_goal).length;
  const awayGoals = goals.filter((g) => g.side === 'away' && !g.is_own_goal).length;
  const homeOwnGoals = goals.filter((g) => g.side === 'away' && g.is_own_goal).length;
  const awayOwnGoals = goals.filter((g) => g.side === 'home' && g.is_own_goal).length;

  const homeYellowCards = cards.filter((c) => c.side === 'home' && c.card_type_code === 100).length;
  const awayYellowCards = cards.filter((c) => c.side === 'away' && c.card_type_code === 100).length;
  const homeRedCards = cards.filter((c) => c.side === 'home' && c.card_type_code === 101).length;
  const awayRedCards = cards.filter((c) => c.side === 'away' && c.card_type_code === 101).length;

  return {
    matchId,
    home: {
      goals: homeGoals,
      ownGoals: homeOwnGoals,
      yellowCards: homeYellowCards,
      redCards: homeRedCards,
    },
    away: {
      goals: awayGoals,
      ownGoals: awayOwnGoals,
      yellowCards: awayYellowCards,
      redCards: awayRedCards,
    },
  };
}





