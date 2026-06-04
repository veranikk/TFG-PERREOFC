/**
 * Contains the business and persistence logic for the notifications backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';
import { NotFoundError } from '../../errors.js';

// NOTE: notifications table needs to be created via SQL migration first
// Using function to bypass type checking until Supabase schema is regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNotificationsTable = (supabase: any) => supabase.from('notifications');

// ── Expo Push API ─────────────────────────────────────────────────────────────

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound?: 'default' | null;
  data?: Record<string, unknown>;
  badge?: number;
}

/**
 * Envía notificaciones push a través de la Expo Push API.
 * Agrupa en lotes de 100 (límite de la API de Expo).
 * Silencioso en caso de error — la notificación ya está en el inbox.
 */
async function sendExpoPush(messages: ExpoPushMessage[]) {
  if (messages.length === 0) return;

  // Filtrar tokens vacíos o inválidos
  const valid = messages.filter(
    (m) => m.to && (m.to.startsWith('ExponentPushToken[') || m.to.startsWith('ExpoPushToken[')),
  );
  if (valid.length === 0) return;

  // Dividir en lotes de 100
  const chunks: ExpoPushMessage[][] = [];
  for (let i = 0; i < valid.length; i += 100) {
    chunks.push(valid.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(chunk.length === 1 ? chunk[0] : chunk),
      });
    } catch {
      // Error de red — no bloquea el flujo principal
    }
  }
}

// ── Internal helper ──────────────────────────────────────────────────────────

/**
 * Crea una notificación en el inbox del usuario.
 * - Siempre guarda en BD (para el inbox in-app).
 * - Solo envía push al dispositivo si el usuario tiene notifications_enabled = true.
 */
export async function createNotification(
  userId: string,
  title: string,
  body: string,
  type: string = 'general',
) {
  const supabase = getAdminClient();

  // 1. Guardar siempre en el inbox
  const { data, error } = await getNotificationsTable(supabase)
    .insert({ user_id: userId, title, body, type })
    .select()
    .single();

  if (error) throw error;

  // 2. Enviar push solo si el usuario lo tiene habilitado
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user } = await (supabase as any)
      .from('users')
      .select('push_token, notifications_enabled')
      .eq('id', userId)
      .single();

    if (user && user.notifications_enabled !== false && user.push_token) {
      await sendExpoPush([{ to: user.push_token, title, body: body ?? '', sound: 'default' }]);
    }
  } catch {
    // La columna puede no existir aún o no hay token — continuamos
  }

  return data;
}

// ── Admin broadcast ──────────────────────────────────────────────────────────

type BroadcastSegment = 'all' | 'aficionados' | 'jugadores' | 'admins';

/**
 * Envía una notificación a todos los usuarios de un segmento.
 * - Siempre guarda en el inbox de todos.
 * - Solo envía push a los que tienen notifications_enabled = true.
 */
export async function broadcastNotification(
  segment: BroadcastSegment,
  title: string,
  body: string,
) {
  const supabase = getAdminClient();

  // Obtener todos los usuarios activos del segmento
  let query = supabase
    .from('users')
    .select('id')
    .is('deleted_at', null)
    .eq('banned', false);

  if (segment === 'aficionados') query = query.eq('role', 'aficionado');
  else if (segment === 'jugadores') query = query.eq('role', 'jugador');
  else if (segment === 'admins') query = query.in('role', ['admin', 'superadmin']);

  const { data: users, error } = await query;
  if (error) throw error;
  if (!users || users.length === 0) return { sent: 0 };

  const userIds: string[] = users.map((u: any) => u.id);

  // 1. Insertar notificaciones en el inbox de todos
  const notifications = userIds.map((id) => ({
    user_id: id,
    title,
    body,
    type: 'broadcast',
  }));

  const { error: insertError } = await getNotificationsTable(supabase).insert(notifications);
  if (insertError) throw insertError;

  // 2. Enviar push solo a los que tienen habilitadas las notificaciones y tienen token
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: usersWithPrefs } = await (supabase as any)
      .from('users')
      .select('push_token, notifications_enabled')
      .in('id', userIds);

    if (usersWithPrefs) {
      const pushMessages: ExpoPushMessage[] = usersWithPrefs
        .filter((u: any) => u.notifications_enabled !== false && u.push_token)
        .map((u: any) => ({ to: u.push_token, title, body: body ?? '', sound: 'default' as const }));

      await sendExpoPush(pushMessages);
    }
  } catch {
    // push falla silenciosamente — las notificaciones ya están en el inbox
  }

  return { sent: userIds.length };
}

// ── Bet win notifications ────────────────────────────────────────────────────

/**
 * Crea notificaciones para los ganadores de apuestas de un partido.
 * Llamado justo después de que el RPC settle_match_bets haya liquidado las apuestas.
 */
export async function createBetWinNotificationsForMatch(matchId: number) {
  const supabase = getAdminClient();

  const { data: bets, error } = await supabase
    .from('user_bets')
    .select('user_id, points_won, match:matches(home_team_name, away_team_name)')
    .eq('match_id', matchId)
    .eq('result', 'win');

  if (error) throw error;
  if (!bets || bets.length === 0) return;

  await Promise.allSettled(
    bets.map((b: any) => {
      const home = b.match?.home_team_name ?? '';
      const away = b.match?.away_team_name ?? '';
      const matchLabel = home && away ? ` — ${home} vs ${away}` : '';
      return createNotification(
        b.user_id,
        '¡Apuesta ganada! 🍑',
        `Has ganado ${b.points_won} puntos${matchLabel}`,
        'bet_win',
      );
    }),
  );
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function getNotifications(userId: string, page: number = 1, limit: number = 20) {
  const supabase = getAdminClient();
  const rangeFrom = (page - 1) * limit;
  const rangeTo = rangeFrom + limit - 1;

  const { data, error, count } = await getNotificationsTable(supabase)
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(rangeFrom, rangeTo);

  if (error) throw error;

  return {
    data: (data ?? []).map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      title: n.title,
      body: n.body,
      type: n.type,
      read: n.read,
      createdAt: n.created_at,
    })),
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  };
}

export async function getUnreadCount(userId: string) {
  const supabase = getAdminClient();

  const { count, error } = await getNotificationsTable(supabase)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)
    .is('deleted_at', null);

  if (error) throw error;

  return { count: count ?? 0 };
}

export async function getUnreadNotifications(userId: string, page: number = 1, limit: number = 20) {
  const supabase = getAdminClient();
  const rangeFrom = (page - 1) * limit;
  const rangeTo = rangeFrom + limit - 1;

  const { data, error, count } = await getNotificationsTable(supabase)
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('read', false)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(rangeFrom, rangeTo);

  if (error) throw error;

  return {
    data: (data ?? []).map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      title: n.title,
      body: n.body,
      type: n.type,
      read: n.read,
      createdAt: n.created_at,
    })),
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  };
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  const supabase = getAdminClient();

  const { data: notif, error: notifError } = await getNotificationsTable(supabase)
    .select('user_id')
    .eq('id', notificationId)
    .single();

  if (notifError || !notif) throw new NotFoundError('Notificación no encontrada');
  if (notif.user_id !== userId) throw new NotFoundError('Notificación no encontrada');

  const { data, error } = await getNotificationsTable(supabase)
    .update({ read: true })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) throw error;

  return { id: data.id, read: data.read };
}

export async function deleteNotification(userId: string, notificationId: string) {
  const supabase = getAdminClient();

  const { data: notif, error: notifError } = await getNotificationsTable(supabase)
    .select('user_id')
    .eq('id', notificationId)
    .single();

  if (notifError || !notif) throw new NotFoundError('Notificación no encontrada');
  if (notif.user_id !== userId) throw new NotFoundError('Notificación no encontrada');

  const { error } = await getNotificationsTable(supabase)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) throw error;

  return { message: 'Notificación eliminada' };
}

export async function markAllNotificationsAsRead(userId: string) {
  const supabase = getAdminClient();

  const { data, error } = await getNotificationsTable(supabase)
    .update({ read: true })
    .eq('user_id', userId)
    .is('deleted_at', null)
    .select('id');

  if (error) throw error;

  return {
    message: 'Notificaciones marcadas como leídas',
    markedCount: (data ?? []).length,
  };
}
