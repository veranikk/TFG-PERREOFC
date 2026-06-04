/**
 * Registers the Fastify endpoints for the teams backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth/authMiddleware.js';
import { NotFoundError } from '../../errors.js';
import { getTeamSquadHandler } from './teamsController.js';
import { getTeamById, getTeamMatches, getTeamStatistics, getTeamKits } from './teamsServices.js';

const teamParamsSchema = z.object({
  teamId: z.coerce.number().int().positive(),
});

const teamMatchesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  seasonId: z.coerce.number().int().positive().optional(),
});

export const teamsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/teams/:id/squad', { preHandler: requireAuth }, getTeamSquadHandler);

  app.get('/teams/:teamId/kits', { preHandler: requireAuth }, async (request, reply) => {
    const params = teamParamsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: 'Parámetros inválidos' });
    return getTeamKits(params.data.teamId);
  });

  app.get('/teams/:teamId', { preHandler: requireAuth }, async (request, reply) => {
    const params = teamParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'Parámetros inválidos', details: params.error.flatten() });
    }

    try {
      return await getTeamById(params.data.teamId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get('/teams/:teamId/matches', { preHandler: requireAuth }, async (request, reply) => {
    const params = teamParamsSchema.safeParse(request.params);
    const query = teamMatchesQuerySchema.safeParse(request.query);

    if (!params.success) {
      return reply.code(400).send({ error: 'Parámetros inválidos', details: params.error.flatten() });
    }
    if (!query.success) {
      return reply.code(400).send({ error: 'Query inválida', details: query.error.flatten() });
    }

    try {
      // TODO: seasonId debería ser mandatorio o tomar el actual
      return await getTeamMatches(params.data.teamId, query.data.seasonId ?? 1, query.data.page, query.data.limit);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get('/teams/:teamId/statistics', { preHandler: requireAuth }, async (request, reply) => {
    const params = teamParamsSchema.safeParse(request.params);
    const query = z.object({ seasonId: z.coerce.number().int().positive().optional() }).safeParse(request.query);

    if (!params.success) {
      return reply.code(400).send({ error: 'Parámetros inválidos', details: params.error.flatten() });
    }
    if (!query.success) {
      return reply.code(400).send({ error: 'Query inválida', details: query.error.flatten() });
    }

    try {
      // TODO: seasonId debería ser mandatorio o tomar el actual
      return await getTeamStatistics(params.data.teamId, query.data.seasonId ?? 1);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });
};




