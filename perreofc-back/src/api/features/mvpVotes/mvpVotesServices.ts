/**
 * Contains the business and persistence logic for the mvp votes backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../errors.js';
import { createNotification } from '../notifications/notificationsServices.js';

export async function castVote(userId: string, matchId: number, playerId: number) {
  const supabase = getAdminClient();

  // 1. Verificar partido finalizado y leer deadline actual
  const { data: match } = await supabase
    .from('matches')
    .select('id, status, mvp_voting_deadline')
    .eq('id', matchId)
    .single();
  if (!match) throw new NotFoundError('Partido no encontrado');
  if (match.status !== 'finished') throw new BadRequestError('Solo se puede votar en partidos finalizados');

  // 1b. Verificar que el plazo de votación no ha expirado
  if (match.mvp_voting_deadline && new Date() > new Date(match.mvp_voting_deadline)) {
    throw new BadRequestError('El plazo de votación al MVP ha terminado');
  }

  // 2. Verificar jugador en alineación
  const { data: inLineup } = await supabase
    .from('match_lineup_entries')
    .select('id, player_name')
    .eq('match_id', matchId)
    .eq('player_id', playerId)
    .maybeSingle();
  if (!inLineup) throw new BadRequestError('El jugador no participó en este partido');

  // 3. Verificar voto previo
  const { data: existingVote } = await supabase
    .from('mvp_votes')
    .select('id')
    .eq('user_id', userId)
    .eq('match_id', matchId)
    .maybeSingle();
  if (existingVote) throw new ConflictError('Ya votaste en este partido');

  // 4. Obtener puntos por votar
  const { data: config } = await supabase
    .from('points_config')
    .select('vote_mvp')
    .single();
  const pointsAwarded = config?.vote_mvp ?? 50;

  // 5. Registrar voto + sumar puntos + transacción
  const { data: user } = await supabase.from('users').select('points').eq('id', userId).single();
  const newBalance = (user?.points ?? 0) + pointsAwarded;

  await Promise.all([
    supabase.from('mvp_votes').insert({ user_id: userId, match_id: matchId, player_id: playerId }),
    supabase.from('users').update({ points: newBalance }).eq('id', userId),
    supabase.from('points_transactions').insert({
      user_id: userId,
      amount: pointsAwarded,
      action: 'vote_mvp',
      reference_id: String(matchId),
      reference_type: 'match',
    }),
  ]);

  // Notificación de puntos ganados por votar (no bloquea la respuesta si falla)
  createNotification(
    userId,
    '¡Voto MVP registrado!',
    `Has ganado ${pointsAwarded} puntos por votar al MVP del partido`,
    'mvp_vote',
  ).catch(() => {/* silencioso */});

  return {
    matchId,
    playerId,
    playerName: inLineup.player_name,
    pointsAwarded,
    newBalance,
    mvpVotingDeadline: match.mvp_voting_deadline ?? null,
  };
}

export async function getVoteResult(matchId: number, userId: string) {
  const supabase = getAdminClient();

  const [votesRes, myVoteRes, matchRes] = await Promise.all([
    supabase.from('mvp_votes').select('player_id').eq('match_id', matchId),
    supabase.from('mvp_votes').select('player_id, created_at').eq('match_id', matchId).eq('user_id', userId).maybeSingle(),
    supabase.from('matches').select('mvp_voting_deadline').eq('id', matchId).single(),
  ]);

  if (votesRes.error) throw votesRes.error;

  const votes = votesRes.data ?? [];
  const totalVotes = votes.length;
  const mvpVotingDeadline = matchRes.data?.mvp_voting_deadline ?? null;

  // Agregar por player_id
  const countMap = new Map<number, number>();
  for (const v of votes) {
    countMap.set(v.player_id, (countMap.get(v.player_id) ?? 0) + 1);
  }

  const sortedEntries = [...countMap.entries()].sort((a, b) => b[1] - a[1]);

  let winner = null;
  let results: { playerId: number; playerName: string | null; votes: number; percentage: number }[] = [];

  if (sortedEntries.length > 0) {
    const playerIds = sortedEntries.map(([id]) => id);
    const { data: players } = await supabase
      .from('players')
      .select('id, full_name')
      .in('id', playerIds);

    const playerMap = new Map((players ?? []).map((p) => [p.id, p.full_name]));

    results = sortedEntries.map(([playerId, count]) => ({
      playerId,
      playerName: playerMap.get(playerId) ?? null,
      votes: count,
      percentage: totalVotes > 0 ? Number(((count / totalVotes) * 100).toFixed(1)) : 0,
    }));

    const [topId, topCount] = sortedEntries[0];
    winner = {
      playerId: topId,
      playerName: playerMap.get(topId) ?? null,
      votes: topCount,
      percentage: totalVotes > 0 ? Number(((topCount / totalVotes) * 100).toFixed(1)) : 0,
    };
  }

  return {
    matchId,
    totalVotes,
    winner,
    results,
    mvpVotingDeadline,
    myVote: myVoteRes.data ? {
      playerId: myVoteRes.data.player_id,
      votedAt: myVoteRes.data.created_at,
    } : null,
  };
}

/**
 * Devuelve todos los jugadores candidatos a MVP de un partido:
 * convocados (banco incluido), titulares y suplentes que entraron.
 *
 * Fuentes:
 *  - match_lineup_entries   → titulares + suplentes que jugaron (scraping post-partido)
 *  - match_squad_call_players → convocados pre-partido (pueden estar en banco sin jugar)
 * Se fusionan por player_id, sin duplicados.
 */
export async function getMvpCandidates(matchId: number) {
  const supabase = getAdminClient();

  const [matchRes, lineupRes, squadRes] = await Promise.all([
    supabase
      .from('matches')
      .select('id, status, mvp_voting_deadline')
      .eq('id', matchId)
      .single(),
    supabase
      .from('match_lineup_entries')
      .select('player_id, player_name, dorsal, is_starter, is_substitute, side')
      .eq('match_id', matchId)
      .order('is_starter', { ascending: false })
      .order('dorsal', { ascending: true }),
    supabase
      .from('match_squad_calls')
      .select('id')
      .eq('match_id', matchId)
      .maybeSingle(),
  ]);

  if (!matchRes.data) throw new NotFoundError('Partido no encontrado');
  if (lineupRes.error) throw lineupRes.error;

  const match = matchRes.data;

  // Mapa player_id → candidato (base: lineup del acta)
  type Candidate = {
    playerId: number | null;
    playerName: string;
    dorsal: number | null;
    isStarter: boolean;
    isSubstitute: boolean;
    isSquadOnly: boolean; // en convocatoria pero no en acta
  };

  const candidateMap = new Map<number, Candidate>();

  for (const p of lineupRes.data ?? []) {
    if (p.player_id == null) continue;
    candidateMap.set(p.player_id, {
      playerId: p.player_id,
      playerName: p.player_name,
      dorsal: p.dorsal,
      isStarter: p.is_starter,
      isSubstitute: p.is_substitute,
      isSquadOnly: false,
    });
  }

  // Añadir convocados que no aparezcan ya en el acta
  if (squadRes.data?.id) {
    const { data: squadPlayers } = await supabase
      .from('match_squad_call_players')
      .select('player_id, player_name')
      .eq('squad_call_id', squadRes.data.id);

    for (const sp of squadPlayers ?? []) {
      if (!candidateMap.has(sp.player_id)) {
        candidateMap.set(sp.player_id, {
          playerId: sp.player_id,
          playerName: sp.player_name,
          dorsal: null,
          isStarter: false,
          isSubstitute: false,
          isSquadOnly: true,
        });
      }
    }
  }

  const deadlineExpired =
    match.mvp_voting_deadline != null &&
    new Date() > new Date(match.mvp_voting_deadline);

  return {
    matchId,
    votingOpen: match.status === 'finished' && !deadlineExpired,
    mvpVotingDeadline: match.mvp_voting_deadline ?? null,
    candidates: [...candidateMap.values()],
  };
}

/**
 * Fija la fecha límite de votación MVP para un partido.
 * La votación cierra a las 23:59:59 del día elegido (hora local del servidor).
 * @param matchId  ID del partido
 * @param date     Fecha en formato YYYY-MM-DD
 */
export async function setMvpVotingDeadline(matchId: number, date: string) {
  const supabase = getAdminClient();

  const { data: match } = await supabase
    .from('matches')
    .select('id, status')
    .eq('id', matchId)
    .single();
  if (!match) throw new NotFoundError('Partido no encontrado');
  if (match.status !== 'finished') throw new BadRequestError('Solo se puede fijar el plazo en partidos finalizados');

  // Cierra a las 23:59:59 del día elegido (hora peninsular española UTC+1/+2)
  // Usamos el offset fijo +02:00 (CEST, verano español) como valor conservador
  const deadline = `${date}T23:59:59+02:00`;

  const { error } = await supabase
    .from('matches')
    .update({ mvp_voting_deadline: deadline })
    .eq('id', matchId);
  if (error) throw error;

  return { matchId, mvpVotingDeadline: new Date(deadline).toISOString() };
}
