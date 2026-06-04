/**
 * Registers the Fastify endpoints for the mvp votes backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { requireAuth, requireRole } from '../auth/authMiddleware.js';
import { castVoteHandler, getVoteResultHandler, setMvpVotingDeadlineHandler, getMvpCandidatesHandler } from './mvpVotesController.js';

export const mvpVotesRoutes: FastifyPluginAsync = async (app) => {
  app.post('/mvp-votes', { preHandler: [requireAuth, requireRole('aficionado', 'jugador')] }, castVoteHandler);
  app.get('/mvp-votes/:matchId', { preHandler: requireAuth }, getVoteResultHandler);
  app.get('/matches/:matchId/mvp-candidates', { preHandler: requireAuth }, getMvpCandidatesHandler);

  // Admin/superadmin: fija la fecha límite de votación MVP de un partido
  app.patch('/admin/matches/:matchId/mvp-deadline', { preHandler: [requireAuth, requireRole('admin', 'superadmin')] }, setMvpVotingDeadlineHandler);
};
