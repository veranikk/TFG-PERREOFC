/**
 * Registers the Fastify endpoints for the home backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../auth/authMiddleware.js';
import { getHomeHandler } from './homeController.js';

export const homeRoutes: FastifyPluginAsync = async (app) => {
  app.get('/home', { preHandler: requireAuth }, getHomeHandler);
};




