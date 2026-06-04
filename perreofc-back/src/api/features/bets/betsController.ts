/**
 * Handles HTTP request and response logic for the bets backend feature.
 * It delegates database work to services and keeps route handlers focused on API behavior.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { placeBetSchema, getMyBetsQuerySchema, settleBetsSchema } from './betsSchema.js';
import { placeBet, getMyBets, settleBets } from './betsServices.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../errors.js';

/** Mapea errores de dominio a códigos HTTP apropiados. */
function handleError(err: any, reply: FastifyReply) {
  if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
  if (err instanceof ConflictError) return reply.code(409).send({ error: err.message });
  if (err instanceof BadRequestError) return reply.code(400).send({ error: err.message });
  throw err;
}

/** Crea una nueva apuesta para un partido (requiere autenticación). */
export async function placeBetHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = placeBetSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Body inválido', details: parsed.error.flatten() });
  try {
    return reply.code(201).send(await placeBet(req.user!.id, parsed.data.matchId, parsed.data.prediction, parsed.data.pointsWagered));
  } catch (err) { return handleError(err, reply); }
}

/** Obtiene las apuestas del usuario autenticado con filtros por resultado y paginación. */
export async function getMyBetsHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = getMyBetsQuerySchema.safeParse(req.query);
  if (!parsed.success) return reply.code(400).send({ error: 'Query inválida' });
  return getMyBets(req.user!.id, parsed.data);
}

/** Cierra apuestas de un partido (calcula ganadores/perdedores). Solo admin. */
export async function settleBetsHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = settleBetsSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Body inválido' });
  try {
    return await settleBets(parsed.data.matchId);
  } catch (err) { return handleError(err, reply); }
}




