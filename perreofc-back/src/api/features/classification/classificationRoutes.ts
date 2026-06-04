/**
 * Registers the Fastify endpoints for the classification backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../auth/authMiddleware.js';
import { getClassificationHandler } from './classificationController.js';

export const classificationRoutes: FastifyPluginAsync = async (app) => {
  app.get('/classification', { preHandler: requireAuth }, getClassificationHandler);
};




