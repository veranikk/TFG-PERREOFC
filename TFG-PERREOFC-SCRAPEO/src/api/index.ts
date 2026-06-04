/**
 * Builds the scraper API router.
 * It mounts scraper routes so jobs can be started or inspected through HTTP.
 */

import { type FastifyInstance } from 'fastify';
import { publicRoutes } from './routes/public.js';
import { internalRoutes } from './routes/internal.js';

export async function registerRoutes(app: FastifyInstance) {
  await publicRoutes(app);
  await internalRoutes(app);
}
