/**
 * Registers the Fastify endpoints for the competitions backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { NotFoundError } from '../../errors.js';
import {
  getCompetitionsForSeason,
  getCompetitionById,
  getCompetitionStandings,
  getCompetitionTopScorers,
  getCompetitionMostYellowCards,
  getCompetitionMostRedCards,
} from './competitionsServices.js';

const competitionParamsSchema = z.object({
  competitionId: z.coerce.number().int().positive(),
});

const seasonParamsSchema = z.object({
  seasonId: z.coerce.number().int().positive(),
});

const competitionQuerySchema = z.object({
  gameTypeId: z.coerce.number().int().positive().optional(),
});

const standingsQuerySchema = z.object({
  roundNumber: z.coerce.number().int().positive().optional(),
});

const statsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const competitionsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/seasons/:seasonId/competitions', async (request, reply) => {
    const params = seasonParamsSchema.safeParse(request.params);
    const query = competitionQuerySchema.safeParse(request.query);

    if (!params.success) {
      return reply.code(400).send({ error: 'Parametros invalidos', details: params.error.flatten() });
    }
    if (!query.success) {
      return reply.code(400).send({ error: 'Query invalida', details: query.error.flatten() });
    }

    return getCompetitionsForSeason({
      seasonId: params.data.seasonId,
      gameTypeId: query.data.gameTypeId,
    });
  });

  app.get('/competitions/:competitionId', async (request, reply) => {
    const params = competitionParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'Parametros invalidos', details: params.error.flatten() });
    }

    try {
      return await getCompetitionById(params.data.competitionId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get('/competitions/:competitionId/standings', async (request, reply) => {
    const params = competitionParamsSchema.safeParse(request.params);
    const query = standingsQuerySchema.safeParse(request.query);

    if (!params.success) {
      return reply.code(400).send({ error: 'Parametros invalidos', details: params.error.flatten() });
    }
    if (!query.success) {
      return reply.code(400).send({ error: 'Query invalida', details: query.error.flatten() });
    }

    try {
      return await getCompetitionStandings(params.data.competitionId, query.data.roundNumber);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get('/competitions/:competitionId/top-scorers', async (request, reply) => {
    const params = competitionParamsSchema.safeParse(request.params);
    const query = statsQuerySchema.safeParse(request.query);

    if (!params.success) {
      return reply.code(400).send({ error: 'Parametros invalidos', details: params.error.flatten() });
    }
    if (!query.success) {
      return reply.code(400).send({ error: 'Query invalida', details: query.error.flatten() });
    }

    try {
      return await getCompetitionTopScorers(params.data.competitionId, query.data.limit);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get('/competitions/:competitionId/top-assists', async (request, reply) => {
    // TODO: top-assists no está disponible en la BD actual
    const params = competitionParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'Parametros invalidos', details: params.error.flatten() });
    }

    return reply.code(200).send({
      competitionId: params.data.competitionId,
      data: [],
      _note: 'Top assists not available in current data source',
    });
  });

  app.get('/competitions/:competitionId/most-yellow-cards', async (request, reply) => {
    const params = competitionParamsSchema.safeParse(request.params);
    const query = statsQuerySchema.safeParse(request.query);

    if (!params.success) {
      return reply.code(400).send({ error: 'Parametros invalidos', details: params.error.flatten() });
    }
    if (!query.success) {
      return reply.code(400).send({ error: 'Query invalida', details: query.error.flatten() });
    }

    try {
      return await getCompetitionMostYellowCards(params.data.competitionId, query.data.limit);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get('/competitions/:competitionId/most-red-cards', async (request, reply) => {
    const params = competitionParamsSchema.safeParse(request.params);
    const query = statsQuerySchema.safeParse(request.query);

    if (!params.success) {
      return reply.code(400).send({ error: 'Parametros invalidos', details: params.error.flatten() });
    }
    if (!query.success) {
      return reply.code(400).send({ error: 'Query invalida', details: query.error.flatten() });
    }

    try {
      return await getCompetitionMostRedCards(params.data.competitionId, query.data.limit);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });
};





