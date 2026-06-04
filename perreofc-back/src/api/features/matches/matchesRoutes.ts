/**
 * Registers the Fastify endpoints for the matches backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { NotFoundError } from '../../errors.js';
import { getMatchById, getMatchLineups, getMatchEvents, getMatchStats } from './matchesServices.js';

const paramsSchema = z.object({
  matchId: z.coerce.number().int().positive(),
});

export const matchesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/matches/:matchId', async (request, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'Parametros invalidos', details: params.error.flatten() });
    }

    try {
      return await getMatchById(params.data.matchId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get('/matches/:matchId/lineups', async (request, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'Parametros invalidos', details: params.error.flatten() });
    }

    try {
      return await getMatchLineups(params.data.matchId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get('/matches/:matchId/events', async (request, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'Parametros invalidos', details: params.error.flatten() });
    }

    try {
      return await getMatchEvents(params.data.matchId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get('/matches/:matchId/stats', async (request, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'Parametros invalidos', details: params.error.flatten() });
    }

    try {
      return await getMatchStats(params.data.matchId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });
};





