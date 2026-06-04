/**
 * Handles HTTP request and response logic for the me backend feature.
 * It delegates database work to services and keeps route handlers focused on API behavior.
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { updateProfileSchema, changePasswordSchema, updateNotifPrefsSchema } from './meSchema.js';
import { updateProfile, changePassword, getNotifPrefs, updateNotifPrefs, getNotificationsEnabled, setNotificationsEnabled, savePushToken } from './meServices.js';
import { BadRequestError, ConflictError } from '../../errors.js';

function handleMeError(err: any, reply: FastifyReply) {
  if (err instanceof ConflictError) return reply.code(409).send({ error: err.message });
  if (err instanceof BadRequestError) return reply.code(400).send({ error: err.message });
  throw err;
}

export async function getMe(req: FastifyRequest, _reply: FastifyReply) {
  return req.user!;
}

export async function updateProfileHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Body inválido', details: parsed.error.flatten() });
  try {
    return await updateProfile(req.user!.id, req.user!.email!, parsed.data);
  } catch (err) { return handleMeError(err, reply); }
}

export async function changePasswordHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Body inválido', details: parsed.error.flatten() });
  try {
    return await changePassword(
      req.user!.id,
      req.user!.username,
      req.user!.email!,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );
  } catch (err) { return handleMeError(err, reply); }
}

export async function getNotifPrefsHandler(req: FastifyRequest, _reply: FastifyReply) {
  return getNotifPrefs(req.user!.id);
}

export async function updateNotifPrefsHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = updateNotifPrefsSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Body inválido' });
  return updateNotifPrefs(req.user!.id, parsed.data);
}

export async function getNotificationsEnabledHandler(req: FastifyRequest, _reply: FastifyReply) {
  return getNotificationsEnabled(req.user!.id);
}

export async function setNotificationsEnabledHandler(req: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ enabled: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Body inválido — se esperaba { enabled: boolean }' });
  return setNotificationsEnabled(req.user!.id, parsed.data.enabled);
}

export async function savePushTokenHandler(req: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({ token: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Token inválido' });
  try {
    return await savePushToken(req.user!.id, parsed.data.token);
  } catch (err) { return handleMeError(err, reply); }
}




