/**
 * Registers the Fastify endpoints for the health backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => ({ ok: true, timestamp: new Date().toISOString() }));
};




