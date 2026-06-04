/**
 * Handles HTTP request and response logic for the points backend feature.
 * It delegates database work to services and keeps route handlers focused on API behavior.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { getPointsHistoryQuerySchema, updatePointsConfigSchema } from './pointsSchema.js';
import { getPointsConfig, claimDailyLogin, getPointsHistory, updatePointsConfig } from './pointsServices.js';
import { ConflictError } from '../../errors.js';

export async function getPointsConfigHandler(_req: FastifyRequest, _reply: FastifyReply) {
  return getPointsConfig();
}

export async function dailyLoginHandler(req: FastifyRequest, reply: FastifyReply) {
  if (req.user!.role !== 'aficionado') {
    return reply.code(403).send({ error: 'Solo los aficionados pueden reclamar el bonus diario' });
  }
  try {
    return await claimDailyLogin(req.user!.id);
  } catch (err) {
    if (err instanceof ConflictError) return reply.code(409).send({ error: err.message, alreadyClaimed: true });
    throw err;
  }
}

export async function getPointsHistoryHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = getPointsHistoryQuerySchema.safeParse(req.query);
  if (!parsed.success) return reply.code(400).send({ error: 'Query inválida' });
  return getPointsHistory(req.user!.id, parsed.data);
}

export async function updatePointsConfigHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = updatePointsConfigSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Body inválido', details: parsed.error.flatten() });
  return updatePointsConfig(parsed.data);
}




