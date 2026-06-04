/**
 * Registers the Fastify endpoints for the squad calls backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { requireAuth, requireRole } from '../auth/authMiddleware.js';
import { NotFoundError, ForbiddenError } from '../../errors.js';
import { matchIdParamsSchema, upsertSquadCallSchema } from './squadCallsSchema.js';
import { getSquadCall, upsertSquadCall, deleteSquadCall } from './squadCallsServices.js';

export const squadCallsRoutes: FastifyPluginAsync = async (app) => {
  // GET /matches/:matchId/squad-call
  // Jugador ve su convocatoria (si está convocado) o el estado general
  // Admin/superadmin ven todo
  app.get('/matches/:matchId/squad-call', { preHandler: requireAuth }, async (request, reply) => {
    const params = matchIdParamsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: 'Parámetros inválidos' });

    try {
      const call = await getSquadCall(params.data.matchId);
      if (!call) return reply.code(204).send();
      return call;
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  // POST /matches/:matchId/squad-call — crear/actualizar (upsert)
  app.post(
    '/matches/:matchId/squad-call',
    { preHandler: [requireAuth, requireRole('admin', 'superadmin')] },
    async (request, reply) => {
      const params = matchIdParamsSchema.safeParse(request.params);
      const body = upsertSquadCallSchema.safeParse(request.body);
      if (!params.success || !body.success) {
        return reply.code(400).send({ error: 'Datos inválidos', details: body.error?.flatten() });
      }

      try {
        const result = await upsertSquadCall(
          request.user!.id,
          request.user!.username,
          params.data.matchId,
          {
            reportTime:  body.data.reportTime  ?? null,
            location:    body.data.location    ?? null,
            kitSlot:     body.data.kitSlot,
            shirtColor:  body.data.shirtColor  ?? null,
            shortsColor: body.data.shortsColor ?? null,
            socksColor:  body.data.socksColor  ?? null,
            players:     body.data.players,
          },
        );
        return reply.code(200).send(result);
      } catch (err) {
        if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
        if (err instanceof ForbiddenError) return reply.code(403).send({ error: err.message });
        throw err;
      }
    },
  );

  // DELETE /matches/:matchId/squad-call
  app.delete(
    '/matches/:matchId/squad-call',
    { preHandler: [requireAuth, requireRole('admin', 'superadmin')] },
    async (request, reply) => {
      const params = matchIdParamsSchema.safeParse(request.params);
      if (!params.success) return reply.code(400).send({ error: 'Parámetros inválidos' });

      try {
        await deleteSquadCall(request.user!.id, request.user!.username, params.data.matchId);
        return reply.code(204).send();
      } catch (err) {
        if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
        throw err;
      }
    },
  );
};
