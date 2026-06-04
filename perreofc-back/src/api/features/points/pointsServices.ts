/**
 * Contains the business and persistence logic for the points backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import { ConflictError } from '../../errors.js';

export async function getPointsConfig() {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from('points_config').select('*').single();
  if (error) throw error;
  return {
    register:  data.register,
    dailyLogin: data.daily_login,
    voteMvp:   data.vote_mvp,
    bet:       data.bet,
    winBet:    data.win_bet,
    updatedAt: data.updated_at,
  };
}

export async function claimDailyLogin(userId: string) {
  const supabase = getAdminClient();

  // Comprobar si ya fue reclamado hoy (UTC)
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { data: existing } = await supabase
    .from('points_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('action', 'daily_login')
    .gte('created_at', startOfDay.toISOString())
    .maybeSingle();

  if (existing) throw new ConflictError('Ya reclamaste el bonus de hoy');

  const { data: config } = await supabase.from('points_config').select('daily_login').single();
  const pointsAwarded = config?.daily_login ?? 10;

  const { data: user } = await supabase.from('users').select('points').eq('id', userId).single();
  const newBalance = (user?.points ?? 0) + pointsAwarded;

  await Promise.all([
    supabase.from('users').update({ points: newBalance, last_login_at: new Date().toISOString() }).eq('id', userId),
    supabase.from('points_transactions').insert({
      user_id: userId,
      amount: pointsAwarded,
      action: 'daily_login',
    }),
  ]);

  return { pointsAwarded, newBalance, alreadyClaimed: false };
}

export async function getPointsHistory(userId: string, params: { action?: 'register' | 'daily_login' | 'vote_mvp' | 'bet' | 'win_bet' | 'adjustment'; page: number; limit: number; since?: string }) {
  const supabase = getAdminClient();
  const rangeFrom = (params.page - 1) * params.limit;

  let query = supabase
    .from('points_transactions')
    .select('id, amount, action, reference_id, reference_type, created_at', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(rangeFrom, rangeFrom + params.limit - 1);

  if (params.action) query = query.eq('action', params.action);
  if (params.since)  query = query.gte('created_at', params.since);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data ?? [],
    pagination: {
      page: params.page,
      limit: params.limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / params.limit),
    },
  };
}

export async function updatePointsConfig(data: {
  register?:   number;
  dailyLogin?: number;
  voteMvp?:    number;
  winBet?:     number;
}) {
  const supabase = getAdminClient();
  const update: Record<string, number | string> = {
    updated_at: new Date().toISOString(),
  };
  if (data.register   !== undefined) update['register']    = data.register;
  if (data.dailyLogin !== undefined) update['daily_login'] = data.dailyLogin;
  if (data.voteMvp    !== undefined) update['vote_mvp']    = data.voteMvp;
  if (data.winBet     !== undefined) update['win_bet']     = data.winBet;

  const { data: updated, error } = await supabase
    .from('points_config')
    .update(update)
    .eq('id', 1)
    .select('*')
    .single();
  if (error) throw error;

  return {
    register:  updated.register,
    dailyLogin: updated.daily_login,
    voteMvp:   updated.vote_mvp,
    bet:       updated.bet,
    winBet:    updated.win_bet,
    updatedAt: updated.updated_at,
  };
}




