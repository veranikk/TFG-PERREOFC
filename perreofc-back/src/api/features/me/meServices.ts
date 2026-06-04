/**
 * Contains the business and persistence logic for the me backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient, getAnonClient } from '../../../shared/supabase.js';
import type { TablesUpdate } from '../../../shared/types/database.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../errors.js';
import { logAction } from '../logs/logsServices.js';

export async function updateProfile(userId: string, email: string, fields: {
  firstName?: string;
  lastName?: string;
  username?: string;
  avatarUrl?: string | null;
}) {
  const supabase = getAdminClient();

  if (fields.username) {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', fields.username)
      .neq('id', userId)
      .maybeSingle();
    if (existing) throw new ConflictError('El username ya está en uso');
  }

  const update: TablesUpdate<'users'> = { updated_at: new Date().toISOString() };
  if (fields.firstName !== undefined) update.first_name = fields.firstName;
  if (fields.lastName !== undefined) update.last_name = fields.lastName;
  if (fields.username !== undefined) update.username = fields.username;
  if (fields.avatarUrl !== undefined) update.avatar_url = fields.avatarUrl;

  const { data, error } = await supabase
    .from('users')
    .update(update)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;

  await logAction({
    userId,
    username: data.username,
    action: 'user.update_profile',
    entityType: 'users',
    entityId: userId,
  });

  return {
    id: data.id,
    email,
    username: data.username,
    firstName: data.first_name,
    lastName: data.last_name,
    avatarUrl: data.avatar_url ?? undefined,
    role: data.role,
    points: data.points,
    banned: data.banned,
    createdAt: data.created_at,
  };
}

export async function changePassword(
  userId: string,
  username: string,
  _email: string,
  currentPassword: string,
  newPassword: string,
) {
  // 1. Verificar contraseña actual usando el email actual de Supabase auth (no el del JWT, que puede ser obsoleto)
  const { data: { user: authUser } } = await getAdminClient().auth.admin.getUserById(userId);
  const email = authUser?.email;
  if (!email) throw new BadRequestError('No se encontró el email del usuario');

  const anonClient = getAnonClient();
  const { error: signInErr } = await anonClient.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (signInErr) throw new BadRequestError('Contraseña actual incorrecta');

  // 2. Actualizar contraseña
  const { error } = await getAdminClient().auth.admin.updateUserById(userId, {
    password: newPassword,
  });
  if (error) throw error;

  await logAction({
    userId,
    username,
    action: 'user.change_password',
    entityType: 'users',
    entityId: userId,
  });
  return { message: 'Contraseña actualizada correctamente' };
}

export async function getNotifPrefs(userId: string) {
  // notification_preferences fue reemplazada por users.notifications_enabled (migración 035)
  const { data, error } = await getAdminClient()
    .from('users')
    .select('notifications_enabled')
    .eq('id', userId)
    .single();

  if (error) throw error;

  const enabled = (data as any).notifications_enabled ?? true;
  return {
    pushEnabled: enabled,
    emailEnabled: enabled,
    matchReminders: enabled,
    newsUpdates: enabled,
  };
}

export async function getNotificationsEnabled(userId: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (getAdminClient() as any)
      .from('users')
      .select('notifications_enabled')
      .eq('id', userId)
      .single();

    if (error) throw error;
    // Si la columna no existe aún, Supabase devuelve el campo como undefined
    if (data && 'notifications_enabled' in data) {
      return { enabled: data.notifications_enabled ?? true };
    }
    return { enabled: true };
  } catch {
    // Columna no existe todavía — devolver default
    return { enabled: true };
  }
}

export async function setNotificationsEnabled(userId: string, enabled: boolean) {
  const { error } = await getAdminClient()
    .from('users')
    .update({ notifications_enabled: enabled } as any)
    .eq('id', userId);

  if (error) throw error;
  return { enabled };
}

export async function savePushToken(userId: string, token: string) {
  const { error } = await (getAdminClient() as any)
    .from('users')
    .update({ push_token: token })
    .eq('id', userId);

  if (error) throw error;
  return { saved: true };
}

export async function updateNotifPrefs(userId: string, prefs: {
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  matchReminders?: boolean;
  newsUpdates?: boolean;
}) {
  // Consolidar todos los toggles en users.notifications_enabled (migración 035)
  const enabled = prefs.pushEnabled ?? prefs.emailEnabled ?? prefs.matchReminders ?? prefs.newsUpdates;

  if (enabled !== undefined) {
    const { error } = await getAdminClient()
      .from('users')
      .update({ notifications_enabled: enabled } as any)
      .eq('id', userId);
    if (error) throw error;
  }

  return getNotifPrefs(userId);
}





