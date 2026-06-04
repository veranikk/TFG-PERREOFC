/**
 * Registers the Fastify endpoints for the bets backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth/authMiddleware.js';
import { requireRole } from '../auth/authMiddleware.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../errors.js';
import { placeBetHandler, getMyBetsHandler, settleBetsHandler } from './betsController.js';
import {
  getMatchBets,
  editBet,
  cancelBet,
  getBetStatistics,
  getBetsLeaderboard,
} from './betsServices.js';

const matchParamsSchema = z.object({
  matchId: z.coerce.number().int().positive(),
});

const betParamsSchema = z.object({
  betId: z.string().uuid(),
});

const editBetSchema = z.object({
  prediction: z.enum(['home', 'draw', 'away']),
  pointsWagered: z.number().int().positive(),
});

const leaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
});

function handleError(err: any, reply: any) {
  if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
  if (err instanceof ForbiddenError) return reply.code(403).send({ error: err.message });
  if (err instanceof BadRequestError) return reply.code(400).send({ error: err.message });
  throw err;
}

export const betsRoutes: FastifyPluginAsync = async (app) => {
  app.post('/bets', { preHandler: requireAuth }, placeBetHandler);
  app.get('/bets', { preHandler: requireAuth }, getMyBetsHandler);
  app.post('/bets/settle', { preHandler: [requireAuth, requireRole('admin', 'superadmin')] }, settleBetsHandler);

  // GET /matches/:matchId/bets — apuestas del usuario para un partido
  app.get('/matches/:matchId/bets', { preHandler: requireAuth }, async (request, reply) => {
    const params = matchParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'Parámetros inválidos', details: params.error.flatten() });
    }

    try {
      return await getMatchBets(request.user!.id, params.data.matchId);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // PUT /bets/:betId — editar una apuesta
  app.put('/bets/:betId', { preHandler: requireAuth }, async (request, reply) => {
    const params = betParamsSchema.safeParse(request.params);
    const body = editBetSchema.safeParse(request.body);

    if (!params.success) {
      return reply.code(400).send({ error: 'Parámetros inválidos', details: params.error.flatten() });
    }
    if (!body.success) {
      return reply.code(400).send({ error: 'Body inválido', details: body.error.flatten() });
    }

    try {
      return reply.code(200).send(await editBet(request.user!.id, params.data.betId, body.data.prediction, body.data.pointsWagered));
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // DELETE /bets/:betId — cancelar una apuesta
  app.delete('/bets/:betId', { preHandler: requireAuth }, async (request, reply) => {
    const params = betParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'Parámetros inválidos', details: params.error.flatten() });
    }

    try {
      return reply.code(200).send(await cancelBet(request.user!.id, params.data.betId));
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // GET /users/me/bets/statistics — mis estadísticas de apuestas
  app.get('/users/me/bets/statistics', { preHandler: requireAuth }, async (request, reply) => {
    try {
      return await getBetStatistics(request.user!.id);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // GET /leaderboard/bets — top apostadores
  app.get('/leaderboard/bets', { preHandler: requireAuth }, async (request, reply) => {
    const query = leaderboardQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: 'Query inválida', details: query.error.flatten() });
    }

    try {
      return await getBetsLeaderboard(query.data.limit);
    } catch (err) {
      return handleError(err, reply);
    }
  });
};




