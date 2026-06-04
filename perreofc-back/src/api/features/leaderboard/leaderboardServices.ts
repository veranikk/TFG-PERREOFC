/**
 * Contains the business and persistence logic for the leaderboard backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Lunes
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function getLeaderboard(period: string, limit: number, currentUserId: string) {
  const supabase = getAdminClient();

  // Para "total" usamos users.points directamente
  if (period === 'total') {
    const { data: users } = await supabase
      .from('users')
      .select('id, username, avatar_url, points')
      .is('deleted_at', null)
      .eq('banned', false)
      .eq('role', 'aficionado')
      .gt('points', 0)
      .order('points', { ascending: false })
      .limit(limit);

    const ranked = (users ?? []).map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      username: u.username,
      avatarUrl: u.avatar_url,
      points: u.points,
      isCurrentUser: u.id === currentUserId,
    }));

    // Añadir usuario actual si no está en el top (solo si es aficionado)
    if (!ranked.some((r) => r.isCurrentUser)) {
      const { data: me } = await supabase
        .from('users')
        .select('id, username, avatar_url, points, role')
        .eq('id', currentUserId)
        .single();
      if (me && me.role === 'aficionado') {
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gt('points', me.points)
          .is('deleted_at', null)
          .eq('banned', false)
          .eq('role', 'aficionado');
        ranked.push({ rank: (count ?? 0) + 1, userId: me.id, username: me.username, avatarUrl: me.avatar_url, points: me.points, isCurrentUser: true });
      }
    }
    return { period, data: ranked };
  }

  // Para monthly/weekly: agregar desde points_transactions solo para aficionados
  const fromDate = period === 'weekly' ? getWeekStart() : getMonthStart();
  // Obtener IDs de aficionados activos
  const { data: aficionados, error: aficionadosError } = await supabase
    .from('users')
    .select('id')
    .is('deleted_at', null)
    .eq('banned', false)
    .eq('role', 'aficionado');

  if (aficionadosError) console.error('[leaderboard] Error fetching aficionados:', aficionadosError);

  const aficionadoIds = new Set((aficionados ?? []).map((u) => u.id));

  if (aficionadoIds.size === 0) return { period, data: [] };

  const { data: txns, error: txnsError } = await supabase
    .from('points_transactions')
    .select('user_id, amount')
    .gte('created_at', fromDate.toISOString())
    .gt('amount', 0);

  if (txnsError) console.error('[leaderboard] Error fetching transactions:', txnsError);

  const pointsByUser = new Map<string, number>();
  for (const t of txns ?? []) {
    if (aficionadoIds.has(t.user_id)) {
      pointsByUser.set(t.user_id, (pointsByUser.get(t.user_id) ?? 0) + t.amount);
    }
  }

  const sorted = [...pointsByUser.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const userIds = sorted.map(([id]) => id);
  const { data: users } = userIds.length > 0
    ? await supabase.from('users').select('id, username, avatar_url').in('id', userIds)
    : { data: [] };

  const usersById = new Map((users ?? []).map((u) => [u.id, u]));

  const ranked = sorted.map(([userId, pts], i) => {
    const u = usersById.get(userId);
    return { rank: i + 1, userId, username: u?.username ?? '?', avatarUrl: u?.avatar_url ?? null, points: pts, isCurrentUser: userId === currentUserId };
  });

  // Añadir usuario actual si es aficionado y no está en el top
  if (!ranked.some((r) => r.isCurrentUser) && aficionadoIds.has(currentUserId)) {
    const myPoints = pointsByUser.get(currentUserId) ?? 0;
    const myRank = [...pointsByUser.values()].filter((p) => p > myPoints).length + 1;
    const { data: me } = await supabase.from('users').select('id, username, avatar_url').eq('id', currentUserId).single();
    if (me) {
      ranked.push({ rank: myRank, userId: currentUserId, username: me.username, avatarUrl: me.avatar_url, points: myPoints, isCurrentUser: true });
    }
  }

  return { period, data: ranked };
}




