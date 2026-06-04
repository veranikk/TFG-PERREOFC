/**
 * Registers the Fastify endpoints for the players backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth/authMiddleware.js';
import { NotFoundError } from '../../errors.js';
import { getPlayerHandler } from './playersController.js';
import { getPlayerStatistics, getPlayerMatches } from './playersServices.js';
import { getCurrentSeasonId } from '../seasons/seasonsServices.js';

const playerParamsSchema = z.object({
  playerId: z.coerce.number().int().positive(),
});

const playerStatsQuerySchema = z.object({
  seasonId: z.coerce.number().int().positive().optional(),
});

const playerMatchesQuerySchema = z.object({
  seasonId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const playersRoutes: FastifyPluginAsync = async (app) => {
  app.get('/players/:id', { preHandler: requireAuth }, getPlayerHandler);

  app.get('/players/:playerId/statistics', { preHandler: requireAuth }, async (request, reply) => {
    const params = playerParamsSchema.safeParse(request.params);
    const query = playerStatsQuerySchema.safeParse(request.query);

    if (!params.success) {
      return reply.code(400).send({ error: 'Parámetros inválidos', details: params.error.flatten() });
    }
    if (!query.success) {
      return reply.code(400).send({ error: 'Query inválida', details: query.error.flatten() });
    }

    try {
      const seasonId = query.data.seasonId ?? (await getCurrentSeasonId());
      return await getPlayerStatistics(params.data.playerId, seasonId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get('/players/:playerId/matches', { preHandler: requireAuth }, async (request, reply) => {
    const params = playerParamsSchema.safeParse(request.params);
    const query = playerMatchesQuerySchema.safeParse(request.query);

    if (!params.success) {
      return reply.code(400).send({ error: 'Parámetros inválidos', details: params.error.flatten() });
    }
    if (!query.success) {
      return reply.code(400).send({ error: 'Query inválida', details: query.error.flatten() });
    }

    try {
      const seasonId = query.data.seasonId ?? (await getCurrentSeasonId());
      return await getPlayerMatches(params.data.playerId, seasonId, query.data.page, query.data.limit);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });
};




