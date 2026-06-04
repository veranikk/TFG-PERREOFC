/**
 * Registers the Fastify endpoints for the top scorers backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../auth/authMiddleware.js';
import { getTopScorersHandler } from './topScorersController.js';

export const topScorersRoutes: FastifyPluginAsync = async (app) => {
  app.get('/top-scorers', { preHandler: requireAuth }, getTopScorersHandler);
};




