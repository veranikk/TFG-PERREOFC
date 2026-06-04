/**
 * Contains the business and persistence logic for the users backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { createHash, randomInt } from 'crypto';
import { getAdminClient, getAnonClient } from '../../../shared/supabase.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../errors.js';
import { logger } from '../../../shared/logger.js';
import { env } from '../../../shared/env.js';
import { sendEmail } from '../../../shared/mailer.js';

/** Elimina la cuenta del usuario con soft-delete (marca deleted_at). No elimina de Supabase Auth. */
export async function deleteCurrentUser(userId: string) {
  const supabase = getAdminClient();

  // Soft delete: marcar como deleted_at en lugar de borrar
  const { data, error } = await supabase
    .from('users')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new NotFoundError('Usuario no encontrado');

  return { message: 'Cuenta eliminada correctamente' };
}

/** Obtiene el perfil público de un usuario por ID (sin datos sensibles). */
export async function getPublicUserProfile(userId: string) {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('users')
    .select('id, username, first_name, last_name, avatar_url, points, role, created_at, last_login_at')
    .eq('id', userId)
    .is('deleted_at', null)
    .single();

  if (error || !data) throw new NotFoundError('Usuario no encontrado');

  return {
    id: data.id,
    username: data.username,
    firstName: data.first_name,
    lastName: data.last_name,
    avatarUrl: data.avatar_url,
    points: data.points,
    role: data.role,
    createdAt: data.created_at,
    lastLoginAt: data.last_login_at,
  };
}

/** Calcula estadísticas de apuestas (ganadas, perdidas, pendientes, win rate) para un usuario. */
export async function getUserBetStats(userId: string) {
  const supabase = getAdminClient();

  const { data, error, count } = await supabase
    .from('user_bets')
    .select('result', { count: 'exact' })
    .eq('user_id', userId);

  if (error) throw error;

  const bets = data ?? [];
  const won = bets.filter((b) => b.result === 'win').length;
  const lost = bets.filter((b) => b.result === 'loss').length;
  const pending = bets.filter((b) => b.result === 'pending').length;

  const totalResolved = won + lost;
  const winRate = totalResolved > 0 ? ((won / totalResolved) * 100).toFixed(2) : '0.00';

  return {
    totalBets: count ?? 0,
    won,
    lost,
    pending,
    winRate: `${winRate}%`,
  };
}

export async function listAllUsers(params: {
  page: number;
  limit: number;
  role?: string;
  banned?: boolean;
  search?: string;
}) {
  const supabase = getAdminClient();
  const rangeFrom = (params.page - 1) * params.limit;
  const rangeTo = rangeFrom + params.limit - 1;

  // Obtener emails desde Supabase Auth (paginado a 1000 usuarios máximo)
  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailMap: Record<string, string> = {};
  for (const u of authData?.users ?? []) {
    if (u.email) emailMap[u.id] = u.email;
  }

  let query = supabase
    .from('users')
    .select('id, username, first_name, last_name, role, avatar_url, points, banned, created_at, last_login_at', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(rangeFrom, rangeTo);

  if (params.role) {
    query = query.eq('role', params.role as any);
  }
  if (params.banned !== undefined) {
    query = query.eq('banned', params.banned);
  }
  if (params.search) {
    const s = `%${params.search}%`;
    query = query.or(`username.ilike.${s},first_name.ilike.${s},last_name.ilike.${s}`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  // Si se busca por email, filtrar en memoria después de enriquecer
  let rows = (data ?? []).map((u: any) => ({
    id: u.id,
    username: u.username,
    firstName: u.first_name,
    lastName: u.last_name,
    email: emailMap[u.id] ?? null,
    role: u.role,
    avatarUrl: u.avatar_url,
    points: u.points,
    banned: u.banned,
    createdAt: u.created_at,
    lastLoginAt: u.last_login_at,
  }));

  // Filtro adicional por email (no se puede hacer en Supabase query ya que email está en auth)
  if (params.search) {
    const s = params.search.toLowerCase();
    const emailMatches = rows.filter(
      (u) => u.email?.toLowerCase().includes(s) &&
        !u.username.toLowerCase().includes(s) &&
        !u.firstName?.toLowerCase().includes(s) &&
        !u.lastName?.toLowerCase().includes(s),
    );
    // Combinar sin duplicados: los que ya matcharon por username/name ya están en rows
    // emailMatches son los que sólo matcharon por email
    const alreadyMatched = new Set(rows.map((r) => r.id));
    // rows ya está filtrado por Supabase (username/name), añadir los de email que no están
    // Pero como ya hicimos el query filtrado, sólo tenemos los que matcharon en DB.
    // Para email, necesitamos re-hacer la query SIN filtro y filtrar en memoria.
    // Aquí hacemos la query sin filtro de texto para buscar emails:
    const { data: allData } = await supabase
      .from('users')
      .select('id, username, first_name, last_name, role, avatar_url, points, banned, created_at, last_login_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(0, 999);

    const allRows = (allData ?? []).map((u: any) => ({
      id: u.id,
      username: u.username,
      firstName: u.first_name,
      lastName: u.last_name,
      email: emailMap[u.id] ?? null,
      role: u.role,
      avatarUrl: u.avatar_url,
      points: u.points,
      banned: u.banned,
      createdAt: u.created_at,
      lastLoginAt: u.last_login_at,
    }));

    const merged = allRows.filter((u) =>
      u.username.toLowerCase().includes(s) ||
      u.firstName?.toLowerCase().includes(s) ||
      u.lastName?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s),
    );

    if (params.role) {
      const filtered = merged.filter((u) => u.role === params.role);
      return {
        data: filtered.slice(rangeFrom, rangeFrom + params.limit),
        pagination: {
          page: params.page,
          limit: params.limit,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / params.limit),
        },
      };
    }

    return {
      data: merged.slice(rangeFrom, rangeFrom + params.limit),
      pagination: {
        page: params.page,
        limit: params.limit,
        total: merged.length,
        totalPages: Math.ceil(merged.length / params.limit),
      },
    };
  }

  return {
    data: rows,
    pagination: {
      page: params.page,
      limit: params.limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / params.limit),
    },
  };
}

export async function getAdminUserById(userId: string) {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('users')
    .select('id, username, first_name, last_name, role, avatar_url, points, banned, created_at, last_login_at')
    .eq('id', userId)
    .is('deleted_at', null)
    .single();

  if (error || !data) throw new NotFoundError('Usuario no encontrado');

  const { data: authUser } = await supabase.auth.admin.getUserById(userId);

  return {
    id: data.id,
    username: data.username,
    firstName: data.first_name,
    lastName: data.last_name,
    email: authUser?.user?.email ?? null,
    role: data.role,
    avatarUrl: data.avatar_url,
    points: data.points,
    banned: data.banned,
    createdAt: data.created_at,
    lastLoginAt: data.last_login_at,
  };
}

export async function adjustUserPoints(userId: string, delta: number) {
  const supabase = getAdminClient();

  const { data: user, error: fetchErr } = await supabase
    .from('users')
    .select('points')
    .eq('id', userId)
    .is('deleted_at', null)
    .single();

  if (fetchErr || !user) throw new NotFoundError('Usuario no encontrado');

  const newPoints = Math.max(0, (user.points ?? 0) + delta);

  await Promise.all([
    supabase
      .from('users')
      .update({ points: newPoints, updated_at: new Date().toISOString() })
      .eq('id', userId),
    supabase.from('points_transactions').insert({
      user_id: userId,
      amount: delta,
      action: 'adjustment',
    }),
  ]);

  return { userId, delta, newPoints };
}

export async function banUser(userId: string, banned: boolean, banReason?: string) {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('users')
    .update({
      banned,
      banned_reason: banned ? (banReason ?? null) : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new NotFoundError('Usuario no encontrado');

  return { id: data.id, banned: data.banned, bannedReason: data.banned_reason };
}

export async function updateUserRole(userId: string, newRole: any) {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('users')
    .update({ role: newRole as any, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new NotFoundError('Usuario no encontrado');

  return {
    id: data.id,
    username: data.username,
    role: data.role,
  };
}

export async function getUnlinkedPlayers() {
  const supabase = getAdminClient();

  // Obtener player_ids ya vinculados a algún usuario activo
  const { data: linkedData } = await supabase
    .from('users')
    .select('player_id')
    .not('player_id', 'is', null)
    .is('deleted_at', null);

  const linkedIds = (linkedData ?? []).map((u: any) => u.player_id).filter(Boolean);

  // Solo jugadores del equipo propio (Perreo FC)
  let query = supabase
    .from('team_players')
    .select('player_id, players!inner(id, full_name, first_name, last_name, photo_url)')
    .eq('team_id', env.OWN_TEAM_ID)
    .order('player_id', { ascending: true });

  if (linkedIds.length > 0) {
    query = query.not('player_id', 'in', `(${linkedIds.join(',')})`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const p = row.players;
    return {
      id: p.id,
      fullName: p.full_name,
      firstName: p.first_name,
      lastName: p.last_name,
      photoUrl: p.photo_url,
    };
  });
}

export async function adminCreateUser(
  params: {
    role: 'jugador' | 'admin' | 'superadmin';
    email: string;
    password: string;
    username: string;
    firstName: string;
    lastName: string;
    playerId?: number;
  },
  creatorRole: string,
) {
  if (creatorRole !== 'superadmin' && params.role === 'superadmin') {
    throw new ForbiddenError('Los admins no pueden crear superadmins');
  }

  const supabase = getAdminClient();

  // Comprobar username duplicado
  const { data: existing } = await supabase
    .from('users')
    .select('username')
    .ilike('username', params.username)
    .is('deleted_at', null)
    .limit(1);

  if (existing && existing.length > 0) {
    throw new ConflictError('El nombre de usuario ya está en uso');
  }

  // Crear usuario en Supabase Auth (sin enviar email de verificación)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.toLowerCase().includes('already registered') || authError.message.toLowerCase().includes('already been registered')) {
      throw new ConflictError('El correo electrónico ya está en uso');
    }
    throw authError;
  }

  const userId = authData.user.id;

  // Insertar perfil en public.users
  // Si el trigger de Supabase ya creó la fila (código 23505), actualizamos en su lugar
  const profileData = {
    id: userId,
    username: params.username,
    first_name: params.firstName,
    last_name: params.lastName,
    role: params.role,
    ...(params.playerId ? { player_id: params.playerId } : {}),
  };

  const { error: profileError } = await supabase.from('users').insert(profileData);

  if (profileError) {
    if (profileError.code === '23505') {
      // El trigger ya creó la fila — actualizamos con los datos correctos
      const { error: updateError } = await supabase
        .from('users')
        .update({
          username: params.username,
          first_name: params.firstName,
          last_name: params.lastName,
          role: params.role,
          ...(params.playerId ? { player_id: params.playerId } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        await supabase.auth.admin.deleteUser(userId);
        logger.error({ err: updateError.message, userId }, 'Failed to update user profile after trigger insert');
        throw updateError;
      }
      logger.info({ userId }, 'Profile already existed (trigger ran first), updated with correct role');
    } else {
      await supabase.auth.admin.deleteUser(userId);
      logger.error({ err: profileError.message, userId }, 'Failed to create user profile after auth creation');
      throw profileError;
    }
  }

  return {
    id: userId,
    email: params.email,
    username: params.username,
    firstName: params.firstName,
    lastName: params.lastName,
    role: params.role,
    avatarUrl: null,
    points: 0,
    banned: false,
    createdAt: new Date().toISOString(),
  };
}

export async function requestDeleteAccount(userId: string, userEmail: string) {
  const supabase = getAdminClient();

  // Generar PIN de 8 dígitos con CSPRNG — Math.random() no es criptográficamente seguro
  const pin = String(randomInt(10000000, 100000000));
  const pinHash = createHash('sha256').update(pin).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

  // Upsert: un único PIN activo por usuario
  const { error } = await supabase
    .from('delete_account_pins')
    .upsert(
      { user_id: userId, pin_hash: pinHash, expires_at: expiresAt },
      { onConflict: 'user_id' },
    );

  if (error) throw error;

  // Enviar email con el PIN
  sendEmail({
    to: userEmail,
    subject: '⚠️ Confirmación de eliminación de cuenta - Perreo FC',
    html: `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333;">
  <div style="border-left:4px solid #EF4444;padding:20px;background:#fff;">
    <h2 style="color:#EF4444;margin:0 0 15px 0;">⚠️ Eliminar cuenta</h2>
    <p>Hemos recibido una solicitud para <strong>eliminar tu cuenta de Perreo FC</strong>.</p>
    <p>Usa el siguiente código para confirmar la eliminación:</p>
    <div style="background:#f5f5f5;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
      <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#EF4444;">${pin}</span>
    </div>
    <p style="color:#666;font-size:13px;">Este código expira en <strong>15 minutos</strong>.</p>
    <p style="color:#FF6B6B;font-size:12px;margin-top:20px;">⚠️ Si no has solicitado esto, ignora este email. Tu cuenta permanecerá activa.</p>
    <p style="color:#666;font-size:12px;margin-top:20px;">© 2026 Perreo FC</p>
  </div>
</div>`,
  }).catch((err) => logger.error({ err }, 'Failed to send delete account PIN email'));

  return { message: 'PIN de confirmación enviado a tu email' };
}

export async function confirmDeleteAccount(userId: string, pin: string) {
  const supabase = getAdminClient();

  const pinHash = createHash('sha256').update(pin).digest('hex');

  const { data, error } = await supabase
    .from('delete_account_pins')
    .select('id')
    .eq('user_id', userId)
    .eq('pin_hash', pinHash)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) throw new BadRequestError('Código incorrecto o expirado');

  // Eliminar el PIN para que no pueda reutilizarse
  await supabase.from('delete_account_pins').delete().eq('user_id', userId);

  // Eliminar la cuenta definitivamente
  await hardDeleteUser(userId);

  return { message: 'Cuenta eliminada correctamente' };
}

// ─── Cambio de correo (aficionados) ─────────────────────────────────────────

export async function getEmailChangeStatus(userId: string) {
  const supabase = getAdminClient();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: successAttempts } = await supabase
    .from('email_change_attempts')
    .select('attempted_at')
    .eq('user_id', userId)
    .eq('success', true)
    .gte('attempted_at', twentyFourHoursAgo)
    .order('attempted_at', { ascending: true });

  if ((successAttempts?.length ?? 0) >= 3) {
    const oldest = successAttempts![0];
    const nextAllowedAt = new Date(new Date(oldest.attempted_at).getTime() + 24 * 60 * 60 * 1000).toISOString();
    const retryMs = new Date(nextAllowedAt).getTime() - Date.now();
    const retryHours = Math.ceil(retryMs / (1000 * 60 * 60));
    return {
      canChange: false,
      reason: 'too_many_changes',
      nextAllowedAt,
      retryHours,
      message: `Has alcanzado el límite de cambios de correo. Puedes volver a cambiarlo en ${retryHours}h.`,
    };
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: failAttempts } = await supabase
    .from('email_change_attempts')
    .select('attempted_at')
    .eq('user_id', userId)
    .eq('success', false)
    .gte('attempted_at', oneHourAgo)
    .order('attempted_at', { ascending: true });

  if ((failAttempts?.length ?? 0) >= 5) {
    const oldest = failAttempts![0];
    const nextAllowedAt = new Date(new Date(oldest.attempted_at).getTime() + 60 * 60 * 1000).toISOString();
    const retryMs = new Date(nextAllowedAt).getTime() - Date.now();
    const retryMinutes = Math.ceil(retryMs / (1000 * 60));
    return {
      canChange: false,
      reason: 'too_many_failures',
      nextAllowedAt,
      retryMinutes,
      message: `Demasiados intentos fallidos. Puedes intentarlo de nuevo en ${retryMinutes} min.`,
    };
  }

  return {
    canChange: true,
    changesUsed: successAttempts?.length ?? 0,
    changesMax: 3,
  };
}

export async function requestEmailChange(userId: string, userEmail: string, newEmail: string, currentPassword: string) {
  const supabase = getAdminClient();

  // Rate limit: 3 cambios exitosos en 24h
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: successCount } = await supabase
    .from('email_change_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('success', true)
    .gte('attempted_at', twentyFourHoursAgo);

  if ((successCount ?? 0) >= 3) {
    throw new ForbiddenError('Has alcanzado el límite de cambios de correo por hoy');
  }

  // Rate limit: 5 fallos en 1h
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: failCount } = await supabase
    .from('email_change_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('success', false)
    .gte('attempted_at', oneHourAgo);

  if ((failCount ?? 0) >= 5) {
    throw new ForbiddenError('Demasiados intentos fallidos. Inténtalo más tarde');
  }

  // Verificar contraseña actual usando el email actual de Supabase auth (no el del JWT, que puede ser obsoleto)
  const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
  const currentEmail = authUser?.email ?? userEmail;

  const anonSupabase = getAnonClient();
  const { error: signInError } = await anonSupabase.auth.signInWithPassword({
    email: currentEmail,
    password: currentPassword,
  });
  if (signInError) {
    logger.warn({ err: signInError.message, userId }, 'requestEmailChange: signInWithPassword failed');
    await supabase.from('email_change_attempts').insert({ user_id: userId, success: false, reason: 'wrong_password' });
    throw new BadRequestError('La contraseña actual es incorrecta');
  }

  if (newEmail.toLowerCase() === userEmail.toLowerCase()) {
    throw new BadRequestError('El nuevo correo debe ser diferente al actual');
  }

  // Comprobar que el nuevo correo no está ya registrado
  const { data: authList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailTaken = (authList?.users ?? []).some(
    (u) => u.email?.toLowerCase() === newEmail.toLowerCase() && u.id !== userId,
  );
  if (emailTaken) throw new ConflictError('El correo electrónico ya está en uso');

  // Generar PIN de 8 dígitos con CSPRNG — Math.random() no es criptográficamente seguro
  const pin = String(randomInt(10000000, 100000000));
  const pinHash = createHash('sha256').update(pin).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('email_change_requests')
    .upsert(
      { user_id: userId, new_email: newEmail, pin_hash: pinHash, expires_at: expiresAt },
      { onConflict: 'user_id' },
    );
  if (error) throw error;

  // Enviar PIN al nuevo correo (confirma su titularidad)
  sendEmail({
    to: newEmail,
    subject: '✉️ Confirma tu nuevo correo - Perreo FC',
    html: `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333;">
  <div style="border-left:4px solid #FE6128;padding:20px;background:#fff;">
    <h2 style="color:#FE6128;margin:0 0 15px 0;">✉️ Confirma tu nuevo correo</h2>
    <p>Has solicitado cambiar tu correo en Perreo FC a <strong>${newEmail}</strong>.</p>
    <p>Usa el siguiente código para confirmar el cambio:</p>
    <div style="background:#f5f5f5;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
      <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#FE6128;">${pin}</span>
    </div>
    <p style="color:#666;font-size:13px;">Este código expira en <strong>15 minutos</strong>.</p>
    <p style="color:#FF6B6B;font-size:12px;margin-top:20px;">⚠️ Si no has solicitado este cambio, ignora este email.</p>
    <p style="color:#666;font-size:12px;margin-top:20px;">© 2026 Perreo FC</p>
  </div>
</div>`,
  }).catch((err) => logger.error({ err }, 'Failed to send email change PIN to new email'));

  // Notificación de seguridad al correo actual
  sendEmail({
    to: userEmail,
    subject: '🔔 Solicitud de cambio de correo - Perreo FC',
    html: `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333;">
  <div style="border-left:4px solid #FE6128;padding:20px;background:#fff;">
    <h2 style="color:#FE6128;margin:0 0 15px 0;">🔔 Solicitud de cambio de correo</h2>
    <p>Hemos recibido una solicitud para cambiar el correo de tu cuenta de Perreo FC a <strong>${newEmail}</strong>.</p>
    <p>Hemos enviado un código de verificación a ese nuevo correo para confirmar el cambio.</p>
    <p style="color:#FF6B6B;font-size:12px;margin-top:20px;">⚠️ Si no has solicitado este cambio, contacta con nosotros inmediatamente en info@perreofc.com.</p>
    <p style="color:#666;font-size:12px;margin-top:20px;">© 2026 Perreo FC</p>
  </div>
</div>`,
  }).catch((err) => logger.error({ err }, 'Failed to send email change security notification'));

  return { message: 'Código de verificación enviado a tu nuevo correo' };
}

export async function confirmEmailChange(userId: string, pin: string) {
  const supabase = getAdminClient();
  const pinHash = createHash('sha256').update(pin).digest('hex');

  const { data, error } = await supabase
    .from('email_change_requests')
    .select('new_email')
    .eq('user_id', userId)
    .eq('pin_hash', pinHash)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    await supabase.from('email_change_attempts').insert({ user_id: userId, success: false, reason: 'invalid_pin' });
    throw new BadRequestError('Código incorrecto o expirado');
  }

  const newEmail: string = (data as any).new_email;

  // Actualizar el email en Supabase Auth
  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    email: newEmail,
    email_confirm: true,
  });
  if (updateError) {
    await supabase.from('email_change_attempts').insert({ user_id: userId, success: false, reason: updateError.message });
    throw updateError;
  }

  // Registrar éxito y limpiar la petición
  await Promise.all([
    supabase.from('email_change_attempts').insert({ user_id: userId, new_email: newEmail, success: true }),
    supabase.from('email_change_requests').delete().eq('user_id', userId),
  ]);

  return { message: 'Correo actualizado correctamente', newEmail };
}

// ────────────────────────────────────────────────────────────────────────────

export async function hardDeleteUser(userId: string) {
  const supabase = getAdminClient();

  // 1. Eliminar de Supabase Auth
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) {
    // Si no está en auth (ej: ya fue eliminado), continuar
    logger.warn({ err: authError.message }, 'Auth delete warning — user may already be removed from auth');
  }

  // 2. Eliminar de la tabla users
  const { error: dbError } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (dbError) throw dbError;

  return { message: 'Usuario eliminado correctamente' };
}





