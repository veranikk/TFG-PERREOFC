/**
 * Handles HTTP request and response logic for the users backend feature.
 * It delegates database work to services and keeps route handlers focused on API behavior.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { adminListUsersQuerySchema, adminUpdateUserRoleSchema, adminAdjustPointsSchema, adminCreateUserSchema, adminBanUserSchema } from './usersSchema.js';
import {
  deleteCurrentUser,
  getPublicUserProfile,
  getUserBetStats,
  listAllUsers,
  updateUserRole,
  hardDeleteUser,
  adjustUserPoints,
  getAdminUserById,
  adminCreateUser,
  getUnlinkedPlayers,
  banUser,
  requestDeleteAccount,
  confirmDeleteAccount,
  getEmailChangeStatus,
  requestEmailChange,
  confirmEmailChange,
} from './usersServices.js';
import { logAction } from '../logs/logsServices.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../errors.js';

function handleError(err: any, reply: FastifyReply) {
  if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
  if (err instanceof ForbiddenError) return reply.code(403).send({ error: err.message });
  if (err instanceof BadRequestError) return reply.code(400).send({ error: err.message });
  if (err instanceof ConflictError) return reply.code(409).send({ error: err.message });
  throw err;
}

export async function deleteCurrentUserHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.code(200).send(await deleteCurrentUser(req.user!.id));
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function getPublicUserHandler(req: FastifyRequest, reply: FastifyReply) {
  const { userId } = req.params as { userId: string };

  if (!userId) return reply.code(400).send({ error: 'userId requerido' });

  try {
    return await getPublicUserProfile(userId);
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function getUserStatsHandler(req: FastifyRequest, reply: FastifyReply) {
  const { userId } = req.params as { userId: string };

  if (!userId) return reply.code(400).send({ error: 'userId requerido' });

  try {
    return await getUserBetStats(userId);
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function listUsersHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = adminListUsersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Query inválida', details: parsed.error.flatten() });
  }

  try {
    return await listAllUsers(parsed.data);
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function updateUserRoleHandler(req: FastifyRequest, reply: FastifyReply) {
  const { userId } = req.params as { userId: string };
  const parsed = adminUpdateUserRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Body inválido', details: parsed.error.flatten() });
  }

  // Solo un superadmin puede asignar el rol superadmin — un admin no puede escalar privilegios
  if (parsed.data.role === 'superadmin' && req.user!.role !== 'superadmin') {
    return reply.code(403).send({ error: 'Solo los superadmin pueden asignar el rol superadmin', code: 'FORBIDDEN' });
  }

  try {
    const result = await updateUserRole(userId, parsed.data.role as any);
    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'user.update_role',
      entityType: 'users',
      entityId: userId,
      details: `Nuevo rol: ${parsed.data.role}`,
    });
    return result;
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function hardDeleteUserHandler(req: FastifyRequest, reply: FastifyReply) {
  const { userId } = req.params as { userId: string };

  if (!userId) return reply.code(400).send({ error: 'userId requerido' });

  try {
    const result = await hardDeleteUser(userId);
    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'user.hard_delete',
      entityType: 'users',
      entityId: userId,
    });
    return result;
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function getAdminUserHandler(req: FastifyRequest, reply: FastifyReply) {
  const { userId } = req.params as { userId: string };
  if (!userId) return reply.code(400).send({ error: 'userId requerido' });
  try {
    return reply.code(200).send(await getAdminUserById(userId));
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function adjustUserPointsHandler(req: FastifyRequest, reply: FastifyReply) {
  const { userId } = req.params as { userId: string };
  const parsed = adminAdjustPointsSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Body inválido', details: parsed.error.flatten() });
  }

  try {
    return reply.code(200).send(await adjustUserPoints(userId, parsed.data.delta));
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function banUserHandler(req: FastifyRequest, reply: FastifyReply) {
  const { userId } = req.params as { userId: string };
  const parsed = adminBanUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Body inválido', details: parsed.error.flatten() });
  }

  try {
    const result = await banUser(userId, parsed.data.banned, parsed.data.banReason);
    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: parsed.data.banned ? 'user.ban' : 'user.unban',
      entityType: 'users',
      entityId: userId,
      details: parsed.data.banReason ?? undefined,
    });
    return reply.code(200).send(result);
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function getUnlinkedPlayersHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.code(200).send(await getUnlinkedPlayers());
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function requestDeleteAccountHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user!;
  if (!user.email) {
    return reply.code(400).send({ error: 'No se encontró el email del usuario', code: 'NO_EMAIL' });
  }
  try {
    return reply.code(200).send(await requestDeleteAccount(user.id, user.email));
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function confirmDeleteAccountHandler(
  req: FastifyRequest<{ Body: { pin?: string } }>,
  reply: FastifyReply,
) {
  const user = req.user!;
  const { pin } = req.body;

  if (!pin || !/^\d{8}$/.test(pin)) {
    return reply.code(400).send({ error: 'El PIN debe ser de 8 dígitos', code: 'INVALID_PIN' });
  }
  try {
    return reply.code(200).send(await confirmDeleteAccount(user.id, pin));
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function emailChangeStatusHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.code(200).send(await getEmailChangeStatus(req.user!.id));
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function requestEmailChangeHandler(
  req: FastifyRequest<{ Body: { newEmail?: string; currentPassword?: string } }>,
  reply: FastifyReply,
) {
  const user = req.user!;

  if (user.role !== 'aficionado') {
    return reply.code(403).send({ error: 'Solo los aficionados pueden usar este flujo', code: 'FORBIDDEN' });
  }
  if (!user.email) {
    return reply.code(400).send({ error: 'No se encontró el email del usuario', code: 'NO_EMAIL' });
  }

  const { newEmail, currentPassword } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!newEmail || !emailRegex.test(newEmail)) {
    return reply.code(400).send({ error: 'El nuevo correo no es válido', code: 'INVALID_EMAIL' });
  }
  if (!currentPassword) {
    return reply.code(400).send({ error: 'La contraseña actual es obligatoria', code: 'MISSING_FIELDS' });
  }

  try {
    return reply.code(200).send(await requestEmailChange(user.id, user.email, newEmail, currentPassword));
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function confirmEmailChangeHandler(
  req: FastifyRequest<{ Body: { pin?: string } }>,
  reply: FastifyReply,
) {
  const user = req.user!;
  const { pin } = req.body;

  if (!pin || !/^\d{8}$/.test(pin)) {
    return reply.code(400).send({ error: 'El código debe ser de 8 dígitos', code: 'INVALID_PIN' });
  }

  try {
    return reply.code(200).send(await confirmEmailChange(user.id, pin));
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function createAdminUserHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = adminCreateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Body inválido', details: parsed.error.flatten() });
  }

  const creatorRole = req.user!.role;

  try {
    const user = await adminCreateUser(parsed.data, creatorRole);
    return reply.code(201).send(user);
  } catch (err) {
    return handleError(err, reply);
  }
}





