/**
 * Registers the Fastify endpoints for the leaderboard backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../auth/authMiddleware.js';
import { getLeaderboardHandler } from './leaderboardController.js';

export const leaderboardRoutes: FastifyPluginAsync = async (app) => {
  app.get('/leaderboard', { preHandler: requireAuth }, getLeaderboardHandler);
};




