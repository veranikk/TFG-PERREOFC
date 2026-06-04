/**
 * Contains the business and persistence logic for the competitions backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import { NotFoundError } from '../../errors.js';
import type { Database } from '../../../shared/types/database.js';

export async function getCompetitionsForSeason(params: {
  seasonId: number;
  gameTypeId?: number;
}) {
  const supabase = getAdminClient();
  let query = supabase
    .from('competitions')
    .select('*')
    .eq('season_id', params.seasonId)
    .order('display_order', { ascending: true });

  if (params.gameTypeId !== undefined) {
    query = query.eq('game_type_id', params.gameTypeId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getCompetitionById(competitionId: number) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('competitions')
    .select('*')
    .eq('id', competitionId)
    .single();

  if (error || !data) throw new NotFoundError('Competición no encontrada');
  return data;
}

export async function getCompetitionStandings(competitionId: number, roundNumber?: number) {
  const supabase = getAdminClient();

  // 1. Obtener los grupos de esta competición
  const { data: groups, error: groupsError } = await supabase
    .from('competition_groups')
    .select('id, name')
    .eq('competition_id', competitionId);

  if (groupsError) throw groupsError;
  if (!groups || groups.length === 0) {
    return {
      competitionId,
      standings: [],
    };
  }

  const groupIds = groups.map((g) => g.id);

  // 2. Obtener clasificación para cada grupo
  let query = supabase
    .from('classification_entries')
    .select('*')
    .in('group_id', groupIds);

  if (roundNumber !== undefined) {
    query = query.eq('round_number', roundNumber);
  } else {
    // Si no se especifica ronda, obtener la última disponible por grupo
    // Para simplificar, obtener todas y agrupar por grupo luego
  }

  const { data: entries, error: entriesError } = await query;
  if (entriesError) throw entriesError;

  // Agrupar por grupo y luego por posición
  const standingsByGroup: Record<number, typeof entries> = {};
  for (const group of groups) {
    standingsByGroup[group.id] = (entries ?? []).filter((e) => e.group_id === group.id);
  }

  return {
    competitionId,
    standings: groups.map((group) => ({
      groupId: group.id,
      groupName: group.name,
      entries: (standingsByGroup[group.id] ?? [])
        .sort((a, b) => a.position - b.position)
        .map((e) => ({
          position: e.position,
          teamId: e.team_id,
          teamName: e.team_name,
          teamShieldUrl: e.team_shield_url,
          pj: e.pj,
          wins: e.wins,
          draws: e.draws,
          losses: e.losses,
          goalsFor: e.goals_for,
          goalsAgainst: e.goals_against,
          pts: e.pts,
          ptsSanction: e.pts_sanction,
        })),
    })),
  };
}

export async function getCompetitionTopScorers(competitionId: number, limit: number = 20) {
  const supabase = getAdminClient();

  // 1. Obtener los grupos de esta competición
  const { data: groups, error: groupsError } = await supabase
    .from('competition_groups')
    .select('id')
    .eq('competition_id', competitionId);

  if (groupsError) throw groupsError;
  if (!groups || groups.length === 0) {
    return {
      competitionId,
      topScorers: [],
    };
  }

  const groupIds = groups.map((g) => g.id);

  // 2. Obtener top scorers de esos grupos (última snapshot)
  const { data: latestSnapshot, error: snapshotError } = await supabase
    .from('top_scorers')
    .select('snapshot_date')
    .in('group_id', groupIds)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (snapshotError) throw snapshotError;
  if (!latestSnapshot) {
    return {
      competitionId,
      topScorers: [],
    };
  }

  // 3. Obtener todos los top scorers de la última snapshot
  const { data: scorers, error: scorersError } = await supabase
    .from('top_scorers')
    .select('position, external_player_id, player_id, player_name, player_photo_url, external_team_id, team_id, team_name, team_shield_url, matches_played, goals, penalty_goals, goals_per_match, group_id')
    .in('group_id', groupIds)
    .eq('snapshot_date', latestSnapshot.snapshot_date)
    .order('goals', { ascending: false })
    .order('penalty_goals', { ascending: false })
    .limit(limit);

  if (scorersError) throw scorersError;

  return {
    competitionId,
    snapshotDate: latestSnapshot.snapshot_date,
    topScorers: (scorers ?? []).map((s: any) => ({
      playerId: s.player_id ?? s.external_player_id,
      playerName: s.player_name,
      playerPhotoUrl: s.player_photo_url,
      teamId: s.team_id ?? s.external_team_id,
      teamName: s.team_name,
      teamShieldUrl: s.team_shield_url,
      matchesPlayed: s.matches_played,
      goals: s.goals,
      penaltyGoals: s.penalty_goals,
      goalsPerMatch: s.goals_per_match != null ? Number(s.goals_per_match) : null,
    })),
  };
}

export async function getCompetitionMostYellowCards(competitionId: number, limit: number = 20) {
  const supabase = getAdminClient();

  // 1. Obtener los grupos y sus matches
  const { data: groups, error: groupsError } = await supabase
    .from('competition_groups')
    .select('id')
    .eq('competition_id', competitionId);

  if (groupsError) throw groupsError;
  if (!groups || groups.length === 0) {
    return {
      competitionId,
      mostYellowCards: [],
    };
  }

  const groupIds = groups.map((g) => g.id);

  // 2. Obtener matches de estos grupos
  const { data: matchIds, error: matchesError } = await supabase
    .from('matches')
    .select('id')
    .in('group_id', groupIds);

  if (matchesError) throw matchesError;
  const mIds = (matchIds ?? []).map((m) => m.id);

  if (mIds.length === 0) {
    return {
      competitionId,
      mostYellowCards: [],
    };
  }

  // 3. Agregar tarjetas amarillas por jugador
  const { data: cards, error: cardsError } = await supabase
    .from('match_cards')
    .select('player_id, player_name, side, match:matches(home_team_name, away_team_name, home_team_id, away_team_id, home_shield_url, away_shield_url)')
    .in('match_id', mIds)
    .eq('card_type_code', 100);

  if (cardsError) throw cardsError;

  // Agregar por jugador
  const cardsByPlayer = new Map<
    number,
    {
      playerId: number;
      playerName: string;
      teamName: string;
      teamShieldUrl: string | null;
      count: number;
    }
  >();

  for (const card of cards ?? []) {
    if (!card.player_id || !card.match) continue;

    const key = card.player_id;
    const currentEntry = cardsByPlayer.get(key) || {
      playerId: card.player_id,
      playerName: card.player_name,
      teamName: card.side === 'home' ? card.match.home_team_name : card.match.away_team_name,
      teamShieldUrl: card.side === 'home' ? card.match.home_shield_url : card.match.away_shield_url,
      count: 0,
    };
    currentEntry.count += 1;
    cardsByPlayer.set(key, currentEntry);
  }

  const sorted = Array.from(cardsByPlayer.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return {
    competitionId,
    mostYellowCards: sorted,
  };
}

export async function getCompetitionMostRedCards(competitionId: number, limit: number = 20) {
  const supabase = getAdminClient();

  // 1. Obtener los grupos
  const { data: groups, error: groupsError } = await supabase
    .from('competition_groups')
    .select('id')
    .eq('competition_id', competitionId);

  if (groupsError) throw groupsError;
  if (!groups || groups.length === 0) {
    return {
      competitionId,
      mostRedCards: [],
    };
  }

  const groupIds = groups.map((g) => g.id);

  // 2. Obtener matches
  const { data: matchIds, error: matchesError } = await supabase
    .from('matches')
    .select('id')
    .in('group_id', groupIds);

  if (matchesError) throw matchesError;
  const mIds = (matchIds ?? []).map((m) => m.id);

  if (mIds.length === 0) {
    return {
      competitionId,
      mostRedCards: [],
    };
  }

  // 3. Agregar tarjetas rojas
  const { data: cards, error: cardsError } = await supabase
    .from('match_cards')
    .select('player_id, player_name, side, match:matches(home_team_name, away_team_name, home_team_id, away_team_id, home_shield_url, away_shield_url)')
    .in('match_id', mIds)
    .eq('card_type_code', 101);

  if (cardsError) throw cardsError;

  // Agregar por jugador
  const cardsByPlayer = new Map<
    number,
    {
      playerId: number;
      playerName: string;
      teamName: string;
      teamShieldUrl: string | null;
      count: number;
    }
  >();

  for (const card of cards ?? []) {
    if (!card.player_id || !card.match) continue;

    const key = card.player_id;
    const currentEntry = cardsByPlayer.get(key) || {
      playerId: card.player_id,
      playerName: card.player_name,
      teamName: card.side === 'home' ? card.match.home_team_name : card.match.away_team_name,
      teamShieldUrl: card.side === 'home' ? card.match.home_shield_url : card.match.away_shield_url,
      count: 0,
    };
    currentEntry.count += 1;
    cardsByPlayer.set(key, currentEntry);
  }

  const sorted = Array.from(cardsByPlayer.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return {
    competitionId,
    mostRedCards: sorted,
  };
}





