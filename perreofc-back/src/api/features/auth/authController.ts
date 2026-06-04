/**
 * Handles HTTP request and response logic for the auth backend feature.
 * It delegates database work to services and keeps route handlers focused on API behavior.
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { getAdminClient, getAnonClient } from '../../../shared/supabase.js';
import { env } from '../../../shared/env.js';
import { sendEmail } from '../../../shared/mailer.js';
import { validatePassword } from '../../../shared/validators.js';

/** Autentica usuario con email y contraseña usando Supabase Auth. Devuelve datos del perfil y sesión. */
export async function loginHandler(
  req: FastifyRequest<{ Body: { email?: string; password?: string } }>,
  reply: FastifyReply
) {
  const { email, password } = req.body;

  // Validar campos obligatorios
  if (!email || !password) {
    return reply.code(400).send({
      error: 'Email y contraseña son obligatorios',
      code: 'MISSING_FIELDS'
    });
  }

  const supabase = getAnonClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    req.log.warn({ email, err: error.message }, 'Login failed');
    return reply.code(401).send({
      error: 'Email o contraseña incorrectos',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Enriquecer con profile de public.users para que coincida con el tipo del front
  const { data: profile, error: profileError } = await getAdminClient()
    .from('users')
    .select('id, username, first_name, last_name, avatar_url, role, points, banned, player_id, created_at')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    req.log.error({ profileError }, 'User authenticated but profile not found');
    return reply.code(401).send({ error: 'Perfil de usuario no encontrado', code: 'NO_PROFILE' });
  }

  if (profile.banned) {
    req.log.warn({ userId: data.user.id }, 'Banned user attempted to login');
    return reply.code(403).send({
      error: 'Tu cuenta ha sido suspendida. Para más información contacta con info@perreofc.com',
      code: 'ACCOUNT_BANNED',
    });
  }

  return reply.send({
    user: {
      id: profile.id,
      email: data.user.email,
      username: profile.username,
      firstName: profile.first_name,
      lastName: profile.last_name,
      role: profile.role,
      avatarUrl: profile.avatar_url,
      points: profile.points,
      banned: profile.banned,
      playerId: profile.player_id ?? null,
      createdAt: profile.created_at,
    },
    session: data.session,
  });
}

/** Registra nuevo usuario en Supabase Auth y crea su perfil en public.users. */
export async function registerHandler(
  req: FastifyRequest<{ Body: { email?: string; password?: string; username?: string; firstName?: string; lastName?: string } }>,
  reply: FastifyReply
) {
  const { email, password, username, firstName, lastName } = req.body;

  // Validar campos obligatorios
  if (!email || !password || !username) {
    return reply.code(400).send({
      error: 'Email, contraseña y username son obligatorios',
      code: 'MISSING_FIELDS'
    });
  }

  // Validar que username no tenga espacios
  if (/\s/.test(username)) {
    return reply.code(400).send({
      error: 'El nombre de usuario no puede contener espacios',
      code: 'USERNAME_HAS_SPACES'
    });
  }

  // Validar complejidad de la contraseña
  const passwordError = validatePassword(password);
  if (passwordError) {
    return reply.code(400).send({
      error: passwordError,
      code: 'PASSWORD_REQUIREMENTS'
    });
  }

  const admin = getAdminClient();

  // Comprobar username duplicado (email ya no está en public.users, lo valida Supabase auth)
  const { data: existingByUsername } = await admin
    .from('users')
    .select('username')
    .ilike('username', username)
    .limit(1);

  if (existingByUsername && existingByUsername.length > 0) {
    return reply.code(409).send({
      error: 'El nombre de usuario ya está en uso',
      code: 'USERNAME_TAKEN'
    });
  }

  const supabase = getAnonClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        first_name: firstName,
        last_name: lastName,
      },
    }
  });

  if (error) {
    req.log.warn({ email, err: error.message }, 'Register failed');
    // Supabase devuelve este mensaje cuando el email ya existe
    if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already been registered')) {
      return reply.code(409).send({
        error: 'El correo electrónico ya está en uso',
        code: 'EMAIL_TAKEN'
      });
    }
    return reply.code(400).send({
      error: error.message,
      code: 'REGISTER_FAILED'
    });
  }

  // Supabase no devuelve error cuando el email ya existe: devuelve un usuario
  // "fantasma" con identities vacío cuyo ID no existe en auth.users.
  if (!data.user || (data.user.identities && data.user.identities.length === 0)) {
    return reply.code(409).send({
      error: 'El correo electrónico ya está en uso',
      code: 'EMAIL_TAKEN'
    });
  }

  if (!data.user) {
    return reply.code(400).send({
      error: 'No se pudo crear el usuario',
      code: 'REGISTER_FAILED'
    });
  }

  // Insertar perfil en public.users (no dependemos del trigger de Supabase)
  const { error: profileError } = await admin
    .from('users')
    .insert({
      id: data.user.id,
      username,
      first_name: firstName ?? '',
      last_name: lastName ?? '',
      role: 'aficionado',
    });

  if (profileError) {
    // Si el perfil ya existe (trigger lo creó antes), lo ignoramos
    if (profileError.code !== '23505') {
      req.log.error({ err: profileError.message, userId: data.user.id }, 'Failed to create user profile');
      // Eliminar el usuario de auth para no dejar registros huérfanos
      await admin.auth.admin.deleteUser(data.user.id);
      return reply.code(400).send({
        error: 'Error al crear el perfil de usuario',
        code: 'PROFILE_CREATION_FAILED'
      });
    }
    req.log.info({ userId: data.user.id }, 'Profile already existed (trigger ran first), skipping insert');
  }

  // Otorgar puntos de bienvenida por registro
  const { data: cfg } = await admin.from('points_config').select('register').single();
  const registerPoints = cfg?.register ?? 100;
  await Promise.all([
    admin.from('users').update({ points: registerPoints }).eq('id', data.user.id),
    admin.from('points_transactions').insert({
      user_id: data.user.id,
      amount: registerPoints,
      action: 'register',
    }),
  ]);

  return reply.send({
    user: data.user,
    session: data.session,
    message: 'Usuario registrado exitosamente. Revisa tu email para confirmar la cuenta.',
    pointsAwarded: registerPoints,
  });
}

/** Verifica código OTP (signup, recovery, email_change, invite) y devuelve sesión actualizada. */
export async function verifyOtpHandler(
  req: FastifyRequest<{ Body: { email?: string; token?: string; type?: string } }>,
  reply: FastifyReply
) {
  const { email, token, type } = req.body;

  // Validar campos obligatorios
  if (!email || !token || !type) {
    return reply.code(400).send({
      error: 'Email, token y type son obligatorios',
      code: 'MISSING_FIELDS'
    });
  }

  // Validar tipo de OTP permitido
  const validTypes = ['signup', 'recovery', 'email_change', 'invite'];
  if (!validTypes.includes(type)) {
    return reply.code(400).send({
      error: 'Tipo de OTP no válido',
      code: 'INVALID_OTP_TYPE'
    });
  }

  const supabase = getAnonClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: type as 'signup' | 'recovery' | 'email_change' | 'invite',
  });

  if (error || !data.session || !data.user) {
    req.log.warn({ email, type, err: error?.message }, 'OTP verification failed');
    return reply.code(400).send({
      error: 'Código incorrecto o expirado',
      code: 'INVALID_OTP'
    });
  }

  return reply.send({
    session: data.session,
    user: data.user,
  });
}

export async function resetPasswordWithOtpHandler(
  req: FastifyRequest<{ Body: { email?: string; otp?: string; newPassword?: string } }>,
  reply: FastifyReply
) {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return reply.code(400).send({
      error: 'Email, otp y newPassword son obligatorios',
      code: 'MISSING_FIELDS'
    });
  }

  const supabase = getAnonClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: 'recovery',
  });

  if (error || !data.user) {
    req.log.warn({ email, err: error?.message }, 'OTP verification failed for password reset');
    return reply.code(400).send({
      error: 'Código incorrecto o expirado',
      code: 'INVALID_OTP'
    });
  }

  const admin = getAdminClient();
  const { error: updateError } = await admin.auth.admin.updateUserById(data.user.id, {
    password: newPassword,
  });

  if (updateError) {
    req.log.error({ userId: data.user.id, err: updateError.message }, 'Failed to update password after OTP verification');
    return reply.code(400).send({
      error: updateError.message,
      code: 'PASSWORD_UPDATE_FAILED'
    });
  }

  return reply.send({ message: 'Contraseña actualizada correctamente' });
}

export async function forgotPasswordHandler(
  req: FastifyRequest<{ Body: { email?: string } }>,
  reply: FastifyReply
) {
  const { email } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return reply.code(400).send({
      error: 'Invalid email format',
      code: 'INVALID_EMAIL'
    });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : Array.isArray(forwarded) ? forwarded[0] : null)?.trim() || req.ip;

  req.log.info({ email, ip }, `Password reset request for ${email} from IP ${ip}`);

  const admin = getAdminClient();

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: emailCount } = await admin
    .from('password_reset_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('email', email)
    .gte('attempted_at', oneHourAgo);

  if ((emailCount ?? 0) >= 3) {
    req.log.warn({ email, ip }, `Rate limit exceeded for email ${email} or IP ${ip}`);
    return reply.code(429).send({
      error: 'Too many reset attempts for this email. Try again later'
    });
  }

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count: ipCount } = await admin
    .from('password_reset_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .gte('attempted_at', fifteenMinutesAgo);

  if ((ipCount ?? 0) >= 5) {
    req.log.warn({ email, ip }, `Rate limit exceeded for email ${email} or IP ${ip}`);
    return reply.code(429).send({
      error: 'Too many reset attempts from this IP. Try again later'
    });
  }

  // generateLink genera el OTP sin que Supabase envíe ningún email
  const { data: linkData } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
  });

  if (linkData?.properties?.email_otp) {
    const otp = linkData.properties.email_otp;
    sendEmail({
      to: email,
      subject: '🔑 Recupera tu contraseña - Perreo FC',
      html: `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333;">
  <div style="border-left:4px solid #FE6128;padding:20px;background:#fff;">
    <h2 style="color:#FE6128;margin:0 0 15px 0;">🔑 Recupera tu contraseña</h2>
    <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
    <p>Usa el siguiente código de verificación:</p>
    <div style="text-align:center;margin:24px 0;">
      <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#FE6128;">${otp}</span>
    </div>
    <p style="color:#666;font-size:13px;">Este código expira en 15 minutos.</p>
    <p style="color:#FF6B6B;font-size:12px;margin-top:20px;">⚠️ Si no solicitaste este cambio, ignora este correo.</p>
    <p style="color:#666;font-size:12px;margin-top:20px;">© 2026 Perreo FC</p>
  </div>
</div>`,
    }).catch((err) => req.log.error({ err }, 'Failed to send password reset email'));
  }

  await admin
    .from('password_reset_attempts')
    .insert({ email, ip_address: ip });

  return reply.send({
    message: 'If this email exists in our system, you will receive a password reset link',
    success: true,
  });
}

export async function refreshHandler(
  req: FastifyRequest<{ Body: { refresh_token?: string } }>,
  reply: FastifyReply
) {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return reply.code(400).send({ error: 'refresh_token es obligatorio', code: 'MISSING_FIELDS' });
  }

  const supabase = getAnonClient();
  const { data, error } = await supabase.auth.refreshSession({ refresh_token });

  if (error || !data.session) {
    req.log.warn({ err: error?.message }, 'Token refresh failed');
    return reply.code(401).send({ error: 'refresh_token inválido o expirado', code: 'INVALID_REFRESH_TOKEN' });
  }

  return reply.send({ session: data.session });
}

export async function verifyCurrentPasswordHandler(
  req: FastifyRequest<{ Body: { password?: string } }>,
  reply: FastifyReply
) {
  const user = req.user!;
  const { password } = req.body;

  if (!password) {
    return reply.code(400).send({ error: 'Password required', code: 'MISSING_FIELDS' });
  }

  // Obtener email actual desde Supabase admin (el JWT puede tener un email obsoleto si el usuario lo cambió)
  const { data: { user: authUser } } = await getAdminClient().auth.admin.getUserById(user.id);
  const email = authUser?.email;
  if (!email) {
    return reply.code(400).send({ error: 'No email found', code: 'NO_EMAIL' });
  }

  const anonClient = getAnonClient();
  const { error } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    req.log.warn({ err: error.message, userId: user.id }, 'verifyCurrentPassword: signInWithPassword failed');
    return reply.send({ valid: false });
  }

  return reply.send({ valid: true });
}

export async function changePasswordStatusHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const user = req.user!;
  const admin = getAdminClient();
  const userId = user.id;

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: successAttempts } = await admin
    .from('password_change_attempts')
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
    return reply.send({
      canChange: false,
      reason: 'too_many_changes',
      nextAllowedAt,
      retryHours,
      message: `Has alcanzado el límite de cambios de contraseña. Puedes volver a cambiarla en ${retryHours}h.`,
    });
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: failAttempts } = await admin
    .from('password_change_attempts')
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
    return reply.send({
      canChange: false,
      reason: 'too_many_failures',
      nextAllowedAt,
      retryMinutes,
      message: `Demasiados intentos fallidos. Puedes intentarlo de nuevo en ${retryMinutes} min.`,
    });
  }

  return reply.send({
    canChange: true,
    changesUsed: successAttempts?.length ?? 0,
    changesMax: 3,
  });
}

export async function changePasswordHandler(
  req: FastifyRequest<{ Body: { currentPassword?: string; newPassword?: string; confirmPassword?: string } }>,
  reply: FastifyReply
) {
  const user = req.user!;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return reply.code(400).send({ error: 'All fields are required', code: 'MISSING_FIELDS' });
  }

  if (newPassword !== confirmPassword) {
    req.log.info({ userId: user.id }, `Password validation failed for user ${user.id}: passwords do not match`);
    return reply.code(400).send({ error: 'Passwords do not match', code: 'PASSWORDS_MISMATCH' });
  }

  const validationError = validatePassword(newPassword);
  if (validationError) {
    req.log.info({ userId: user.id }, `Password validation failed for user ${user.id}: ${validationError}`);
    return reply.code(400).send({ error: validationError, code: 'PASSWORD_REQUIREMENTS' });
  }

  const admin = getAdminClient();
  const userId = user.id;

  // Rate limit: max 3 successful changes per 24h
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: successCount } = await admin
    .from('password_change_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('success', true)
    .gte('attempted_at', twentyFourHoursAgo);

  if ((successCount ?? 0) >= 3) {
    req.log.warn({ userId }, `Rate limit exceeded for user ${userId}`);
    const { data: oldestSuccess } = await admin
      .from('password_change_attempts')
      .select('attempted_at')
      .eq('user_id', userId)
      .eq('success', true)
      .gte('attempted_at', twentyFourHoursAgo)
      .order('attempted_at', { ascending: true })
      .limit(1)
      .single();
    const retryMs = oldestSuccess
      ? new Date(oldestSuccess.attempted_at).getTime() + 24 * 60 * 60 * 1000 - Date.now()
      : 24 * 60 * 60 * 1000;
    const retryHours = Math.ceil(retryMs / (1000 * 60 * 60));
    return reply.code(429).send({ error: `Too many password changes. Try again in ${retryHours} hours` });
  }

  // Rate limit: max 5 failed attempts per 1h
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: failCount } = await admin
    .from('password_change_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('success', false)
    .gte('attempted_at', oneHourAgo);

  if ((failCount ?? 0) >= 5) {
    req.log.warn({ userId }, `Rate limit exceeded for user ${userId}`);
    const { data: oldestFail } = await admin
      .from('password_change_attempts')
      .select('attempted_at')
      .eq('user_id', userId)
      .eq('success', false)
      .gte('attempted_at', oneHourAgo)
      .order('attempted_at', { ascending: true })
      .limit(1)
      .single();
    const retryMs = oldestFail
      ? new Date(oldestFail.attempted_at).getTime() + 60 * 60 * 1000 - Date.now()
      : 60 * 60 * 1000;
    const retryMinutes = Math.ceil(retryMs / (1000 * 60));
    return reply.code(429).send({ error: `Too many failed attempts. Try again in ${retryMinutes} minutes` });
  }

  // Verify current password via signInWithPassword
  // Obtener email actual desde admin API (el JWT puede ser obsoleto tras un cambio de email)
  const { data: { user: authUser } } = await admin.auth.admin.getUserById(userId);
  const currentEmail = authUser?.email;
  if (!currentEmail) {
    return reply.code(400).send({ error: 'User email not found', code: 'NO_EMAIL' });
  }

  const anonSupabase = getAnonClient();
  const { error: signInError } = await anonSupabase.auth.signInWithPassword({
    email: currentEmail,
    password: currentPassword,
  });

  if (signInError) {
    req.log.warn({ userId }, `Current password incorrect for user ${userId}`);
    await admin.from('password_change_attempts').insert({ user_id: userId, success: false, reason: 'incorrect_current_password' });
    return reply.code(401).send({ error: 'Current password is incorrect', code: 'WRONG_CURRENT_PASSWORD' });
  }

  // Update password via admin client
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (updateError) {
    req.log.error({ userId, error: updateError.message }, `Password change failed for user ${userId}`);
    await admin.from('password_change_attempts').insert({ user_id: userId, success: false, reason: updateError.message });
    return reply.code(400).send({ error: updateError.message, code: 'UPDATE_FAILED' });
  }

  req.log.info({ userId }, `Password changed successfully for user ${userId}`);
  await admin.from('password_change_attempts').insert({ user_id: userId, success: true, reason: null });

  // Enviar email de confirmación de cambio de contraseña
  sendEmail({
    to: user.email,
    subject: '✅ Contraseña Actualizada - Perreo FC',
    html: `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333;">
  <div style="border-left:4px solid #FE6128;padding:20px;background:#fff;">
    <h2 style="color:#FE6128;margin:0 0 15px 0;">✅ Contraseña Actualizada</h2>
    <p>¡Lo hiciste, campeón! 🎉</p>
    <p>Tu contraseña ha sido actualizada correctamente.</p>
    <p style="color:#FF6B6B;font-size:12px;margin-top:20px;">⚠️ Si no fuiste tú, cambia tu contraseña inmediatamente desde la app.</p>
    <p style="color:#666;font-size:12px;margin-top:20px;">© 2026 Perreo FC</p>
  </div>
</div>`,
  }).catch((err) => req.log.error({ err }, 'Failed to send password changed email'));

  return reply.send({ success: true, message: 'Password changed successfully' });
}

export async function resetPasswordHandler(
  req: FastifyRequest<{ Body: { password?: string } }>,
  reply: FastifyReply
) {
  const { password } = req.body;

  if (!password) {
    return reply.code(400).send({
      error: 'La nueva contraseña es obligatoria',
      code: 'MISSING_FIELDS'
    });
  }

  // Validar complejidad de la nueva contraseña antes de actualizarla
  const validationError = validatePassword(password);
  if (validationError) {
    return reply.code(400).send({ error: validationError, code: 'PASSWORD_REQUIREMENTS' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return reply.code(401).send({ error: 'Falta token de autorización', code: 'UNAUTHORIZED' });
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = getAnonClient();
  const { data: { user }, error: getUserError } = await supabase.auth.getUser(token);

  if (getUserError || !user) {
    return reply.code(401).send({ error: 'Token inválido o expirado', code: 'INVALID_TOKEN' });
  }

  const adminAuth = getAdminClient().auth;
  const { error } = await adminAuth.admin.updateUserById(user.id, {
    password: password
  });

  if (error) {
    return reply.code(400).send({
      error: error.message,
      code: 'RESET_PASSWORD_FAILED'
    });
  }

  return reply.send({ message: 'Contraseña actualizada correctamente' });
}






