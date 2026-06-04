/**
 * Registers the Fastify endpoints for the points backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { requireAuth, requireRole } from '../auth/authMiddleware.js';
import { getPointsConfigHandler, dailyLoginHandler, getPointsHistoryHandler, updatePointsConfigHandler } from './pointsController.js';

export const pointsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/points/config', { preHandler: requireAuth }, getPointsConfigHandler);
  app.post('/me/daily-login', { preHandler: requireAuth }, dailyLoginHandler);
  app.get('/me/points', { preHandler: requireAuth }, getPointsHistoryHandler);
  app.patch('/admin/points/config', { preHandler: [requireAuth, requireRole('superadmin')] }, updatePointsConfigHandler);
};




