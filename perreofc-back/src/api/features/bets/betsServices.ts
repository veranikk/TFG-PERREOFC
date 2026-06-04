/**
 * Contains the business and persistence logic for the bets backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import { BadRequestError, ConflictError, NotFoundError, ForbiddenError } from '../../errors.js';
import { createBetWinNotificationsForMatch } from '../notifications/notificationsServices.js';

/** Crea una apuesta nueva para un partido. Valida partido abierto, saldo suficiente y que no exista apuesta previa. */
export async function placeBet(userId: string, matchId: number, prediction: 'home' | 'draw' | 'away', pointsWagered: number) {
  const supabase = getAdminClient();

  // 1. Verificar partido existe y aceptan apuestas
  const { data: match } = await supabase
    .from('matches')
    .select('id, status, is_closed')
    .eq('id', matchId)
    .single();
  if (!match) throw new NotFoundError('Partido no encontrado');
  if (match.status !== 'upcoming' || match.is_closed) {
    throw new BadRequestError('El partido no acepta apuestas');
  }

  // 2. Verificar apuesta previa del usuario para este partido
  const { data: existing } = await supabase
    .from('user_bets')
    .select('id')
    .eq('user_id', userId)
    .eq('match_id', matchId)
    .maybeSingle();
  if (existing) throw new ConflictError('Ya tienes una apuesta para este partido');

  // 3. Verificar saldo suficiente
  const { data: user } = await supabase
    .from('users')
    .select('points')
    .eq('id', userId)
    .single();
  if (!user || user.points < pointsWagered) {
    throw new BadRequestError('Saldo insuficiente');
  }

  // 4. Crear apuesta + descontar puntos + registrar transacción en paralelo
  const [betRes] = await Promise.all([
    supabase.from('user_bets').insert({
      user_id: userId,
      match_id: matchId,
      prediction,
      points_wagered: pointsWagered,
      result: 'pending',
    }).select().single(),
    supabase.from('users').update({ points: user.points - pointsWagered }).eq('id', userId),
    supabase.from('points_transactions').insert({
      user_id: userId,
      amount: -pointsWagered,
      action: 'bet',
      reference_id: String(matchId),
      reference_type: 'match',
    }),
  ]);

  if (betRes.error) throw betRes.error;

  return {
    ...betRes.data,
    newBalance: user.points - pointsWagered,
  };
}

export async function getMyBets(userId: string, params: { result?: 'pending' | 'win' | 'loss'; page: number; limit: number }) {
  const supabase = getAdminClient();
  const rangeFrom = (params.page - 1) * params.limit;
  const rangeTo = rangeFrom + params.limit - 1;

  let query = supabase
    .from('user_bets')
    .select(`
      id, match_id, prediction, points_wagered, points_won, result, created_at,
      match:matches(home_team_name, away_team_name, date, home_score, away_score)
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(rangeFrom, rangeTo);

  if (params.result) query = query.eq('result', params.result);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: (data ?? []).map((b: any) => ({
      id: b.id,
      matchId: b.match_id,
      homeTeamName: b.match?.home_team_name ?? null,
      awayTeamName: b.match?.away_team_name ?? null,
      matchDate: b.match?.date ?? null,
      prediction: b.prediction,
      pointsWagered: b.points_wagered,
      pointsWon: b.points_won,
      result: b.result,
      createdAt: b.created_at,
    })),
    pagination: {
      page: params.page,
      limit: params.limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / params.limit),
    },
  };
}

export async function settleBets(matchId: number) {
  const supabase = getAdminClient();
  const { data, error } = await supabase.rpc('settle_match_bets', { p_match_id: matchId });
  if (error) {
    if (error.message.includes('MATCH_NOT_FOUND')) throw new NotFoundError('Partido no encontrado');
    if (error.message.includes('MATCH_NOT_CLOSED')) throw new BadRequestError('El partido no está cerrado. Márcalo como is_closed=true primero.');
    if (error.message.includes('MATCH_NOT_FINISHED')) throw new BadRequestError('El partido no está finalizado');
    throw error;
  }

  // Crear notificaciones para los ganadores (no bloquea la respuesta si falla)
  createBetWinNotificationsForMatch(matchId).catch(() => {/* silencioso */});

  return data;
}

export async function getMatchBets(userId: string, matchId: number) {
  const supabase = getAdminClient();

  // Verificar que el partido existe
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id')
    .eq('id', matchId)
    .single();

  if (matchError || !match) throw new NotFoundError('Partido no encontrado');

  // Obtener las apuestas del usuario para este partido
  const { data: bets, error } = await supabase
    .from('user_bets')
    .select('*')
    .eq('user_id', userId)
    .eq('match_id', matchId);

  if (error) throw error;

  return (bets ?? []).map((b: any) => ({
    id: b.id,
    matchId: b.match_id,
    prediction: b.prediction,
    pointsWagered: b.points_wagered,
    pointsWon: b.points_won,
    result: b.result,
    createdAt: b.created_at,
    settledAt: b.settled_at,
  }));
}

export async function editBet(userId: string, betId: string, newPrediction: 'home' | 'draw' | 'away', newPointsWagered: number) {
  const supabase = getAdminClient();

  // 1. Obtener la apuesta actual
  const { data: bet, error: betError } = await supabase
    .from('user_bets')
    .select('user_id, match_id, points_wagered')
    .eq('id', betId)
    .single();

  if (betError || !bet) throw new NotFoundError('Apuesta no encontrada');
  if (bet.user_id !== userId) throw new ForbiddenError('No tienes permisos para editar esta apuesta');

  // 2. Verificar que el partido aún acepta apuestas
  const { data: match } = await supabase
    .from('matches')
    .select('id, status, is_closed')
    .eq('id', bet.match_id)
    .single();

  if (!match || match.status !== 'upcoming' || match.is_closed) {
    throw new BadRequestError('El partido no acepta cambios de apuestas');
  }

  // 3. Ajustar puntos (devolver los anteriores, descontar los nuevos)
  const { data: user } = await supabase
    .from('users')
    .select('points')
    .eq('id', userId)
    .single();

  if (!user) throw new NotFoundError('Usuario no encontrado');

  const pointsDifference = newPointsWagered - (bet.points_wagered ?? 0);
  if (user.points < pointsDifference) {
    throw new BadRequestError('Saldo insuficiente para esta apuesta');
  }

  // 4. Actualizar apuesta y transacciones
  const [updatedBet] = await Promise.all([
    supabase
      .from('user_bets')
      .update({
        prediction: newPrediction,
        points_wagered: newPointsWagered,
      })
      .eq('id', betId)
      .select()
      .single(),
    supabase.from('users').update({ points: user.points - pointsDifference }).eq('id', userId),
    pointsDifference !== 0
      ? supabase.from('points_transactions').insert({
          user_id: userId,
          amount: -pointsDifference,
          action: 'adjustment' as any,
          reference_id: betId,
          reference_type: 'user_bet',
        })
      : Promise.resolve(),
  ]);

  if (updatedBet.error) throw updatedBet.error;

  return {
    ...updatedBet.data,
    newBalance: user.points - pointsDifference,
  };
}

export async function cancelBet(userId: string, betId: string) {
  const supabase = getAdminClient();

  // 1. Obtener la apuesta
  const { data: bet, error: betError } = await supabase
    .from('user_bets')
    .select('user_id, match_id, points_wagered')
    .eq('id', betId)
    .single();

  if (betError || !bet) throw new NotFoundError('Apuesta no encontrada');
  if (bet.user_id !== userId) throw new ForbiddenError('No tienes permisos para cancelar esta apuesta');

  // 2. Verificar que el partido aún acepta cambios
  const { data: match } = await supabase
    .from('matches')
    .select('id, status, is_closed')
    .eq('id', bet.match_id)
    .single();

  if (!match || match.status !== 'upcoming' || match.is_closed) {
    throw new BadRequestError('El partido no acepta cambios de apuestas');
  }

  // 3. Devolver los puntos y eliminar la apuesta
  const { data: user } = await supabase
    .from('users')
    .select('points')
    .eq('id', userId)
    .single();

  if (!user) throw new NotFoundError('Usuario no encontrado');

  const newBalance = user.points + (bet.points_wagered ?? 0);

  await Promise.all([
    supabase.from('user_bets').delete().eq('id', betId),
    supabase.from('users').update({ points: newBalance }).eq('id', userId),
    supabase.from('points_transactions').insert({
      user_id: userId,
      amount: bet.points_wagered ?? 0,
      action: 'adjustment' as any,
      reference_id: betId,
      reference_type: 'user_bet',
    }),
  ]);

  return {
    message: 'Apuesta cancelada correctamente',
    pointsReturned: bet.points_wagered,
    newBalance,
  };
}

export async function getBetStatistics(userId: string) {
  const supabase = getAdminClient();

  const { data: bets, error } = await supabase
    .from('user_bets')
    .select('result, points_wagered, points_won')
    .eq('user_id', userId);

  if (error) throw error;

  const userBets = (bets ?? []).filter((b: any) => b);
  const won = userBets.filter((b: any) => b.result === 'win').length;
  const lost = userBets.filter((b: any) => b.result === 'loss').length;
  const pending = userBets.filter((b: any) => b.result === 'pending').length;

  const totalResolved = won + lost;
  const winRate = totalResolved > 0 ? ((won / totalResolved) * 100).toFixed(2) : '0.00';

  const totalPointsWon = userBets
    .filter((b: any) => b.result === 'win')
    .reduce((sum: number, b: any) => sum + (b.points_won ?? 0), 0);

  return {
    totalBets: userBets.length,
    won,
    lost,
    pending,
    winRate: `${winRate}%`,
    totalPointsWon,
  };
}

export async function getBetsLeaderboard(limit: number = 20) {
  const supabase = getAdminClient();

  // Agregar puntos ganados por usuario en apuestas
  const { data: bets, error } = await supabase
    .from('user_bets')
    .select('user_id, points_won')
    .eq('result', 'win');

  if (error) throw error;

  const pointsByUser = new Map<
    string,
    {
      userId: string;
      totalPointsWon: number;
      winsCount: number;
    }
  >();

  for (const bet of bets ?? []) {
    const key = bet.user_id;
    const current = pointsByUser.get(key) || {
      userId: bet.user_id,
      totalPointsWon: 0,
      winsCount: 0,
    };
    current.totalPointsWon += bet.points_won ?? 0;
    current.winsCount += 1;
    pointsByUser.set(key, current);
  }

  const sorted = Array.from(pointsByUser.values())
    .sort((a, b) => b.totalPointsWon - a.totalPointsWon)
    .slice(0, limit);

  // Enriquecer con datos del usuario (username, avatar)
  const userIds = sorted.map((s) => s.userId);
  const { data: users } = await supabase
    .from('users')
    .select('id, username, avatar_url')
    .in('id', userIds);

  const usersMap = new Map((users ?? []).map((u: any) => [u.id, u]));

  return {
    leaderboard: sorted.map((entry) => {
      const user = usersMap.get(entry.userId);
      return {
        userId: entry.userId,
        username: user?.username ?? 'Unknown',
        avatarUrl: user?.avatar_url,
        totalPointsWon: entry.totalPointsWon,
        winsCount: entry.winsCount,
      };
    }),
  };
}




