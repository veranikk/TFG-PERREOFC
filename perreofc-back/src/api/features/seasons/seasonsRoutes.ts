/**
 * Registers the Fastify endpoints for the seasons backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { NotFoundError } from '../../errors.js';
import { getCurrentSeason, getSeasons, getSeasonById } from './seasonsServices.js';

const paramsSchema = z.object({
  seasonId: z.coerce.number().int().positive(),
});

export const seasonsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/seasons', async () => getSeasons());

  app.get('/seasons/current', async (_request, reply) => {
    try {
      return await getCurrentSeason();
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get('/seasons/:seasonId', async (request, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'Parámetros inválidos', details: params.error.flatten() });
    }

    try {
      return await getSeasonById(params.data.seasonId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });
};





