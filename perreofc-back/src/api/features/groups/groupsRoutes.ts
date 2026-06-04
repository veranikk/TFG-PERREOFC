/**
 * Registers the Fastify endpoints for the groups backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { NotFoundError } from '../../errors.js';
import { getGroupsForCompetition, getGroupHeader } from './groupsServices.js';
import { getCurrentGroupRoundMatches, getGroupMatches } from '../matches/matchesServices.js';

const competitionParamsSchema = z.object({
  competitionId: z.coerce.number().int().positive(),
});

const groupParamsSchema = z.object({
  groupId: z.coerce.number().int().positive(),
});

const matchesQuerySchema = z.object({
  round: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const groupsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/competitions/:competitionId/groups', async (request, reply) => {
    const params = competitionParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'Parametros invalidos', details: params.error.flatten() });
    }

    return getGroupsForCompetition(params.data.competitionId);
  });

  app.get('/groups/:groupId/matches', async (request, reply) => {
    const params = groupParamsSchema.safeParse(request.params);
    const query = matchesQuerySchema.safeParse(request.query);

    if (!params.success) {
      return reply.code(400).send({ error: 'Parametros invalidos', details: params.error.flatten() });
    }
    if (!query.success) {
      return reply.code(400).send({ error: 'Query invalida', details: query.error.flatten() });
    }

    try {
      return await getGroupMatches({
        groupId: params.data.groupId,
        roundNumber: query.data.round,
        page: query.data.page,
        limit: query.data.limit,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get('/groups/:groupId/matches/round/current', async (request, reply) => {
    const params = groupParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'Parametros invalidos', details: params.error.flatten() });
    }

    try {
      return await getCurrentGroupRoundMatches(params.data.groupId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get('/groups/:groupId', async (request, reply) => {
    const params = groupParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'Parametros invalidos', details: params.error.flatten() });
    }

    try {
      return await getGroupHeader(params.data.groupId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });
};





