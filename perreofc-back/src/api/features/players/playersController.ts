/**
 * Handles HTTP request and response logic for the players backend feature.
 * It delegates database work to services and keeps route handlers focused on API behavior.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { playerIdParamsSchema, getPlayerQuerySchema } from './playersSchema.js';
import { getPlayer } from './playersServices.js';
import { getCurrentSeasonId } from '../seasons/seasonsServices.js';
import { NotFoundError } from '../classification/classificationServices.js';

export async function getPlayerHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = playerIdParamsSchema.safeParse(req.params);
  const query = getPlayerQuerySchema.safeParse(req.query);
  if (!params.success || !query.success) {
    return reply.code(400).send({ error: 'Parámetros inválidos' });
  }
  const seasonId = query.data.seasonId ?? (await getCurrentSeasonId());
  try {
    return await getPlayer(params.data.id, seasonId);
  } catch (err: any) {
    if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
    throw err;
  }
}




