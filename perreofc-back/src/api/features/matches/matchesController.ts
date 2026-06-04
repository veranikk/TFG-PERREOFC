/**
 * Handles HTTP request and response logic for the matches backend feature.
 * It delegates database work to services and keeps route handlers focused on API behavior.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { getMatchesQuerySchema, matchIdParamsSchema } from './matchesSchema.js';
import { NotFoundError } from '../../errors.js';
import { getMatchById } from './matchesServices.js';

export async function getMatchesHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = getMatchesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Query invalida', details: parsed.error.flatten() });
  }

  return reply.code(410).send({ error: 'Endpoint reemplazado por /groups/:groupId/matches' });
}

export async function getMatchDetailHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = matchIdParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'ID invalido' });
  }

  try {
    return await getMatchById(parsed.data.id);
  } catch (err) {
    if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
    throw err;
  }
}





