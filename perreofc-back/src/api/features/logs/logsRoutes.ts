/**
 * Registers the Fastify endpoints for the logs backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { requireAuth, requireRole } from '../auth/authMiddleware.js';
import { getLogs } from './logsServices.js';

const FILTER_ACTIONS: Record<string, string[]> = {
  auth: [
    'register',
    'user.update_profile',
    'user.change_password',
    'daily_login',
  ],
  events: [
    'event.create', 'event.update', 'event.delete',
    'event_category.create', 'event_category.delete',
    'news.create', 'news.update', 'news.delete',
    'news_category.create', 'news_category.delete',
    'squad_call.create', 'squad_call.update', 'squad_call.delete',
  ],
  admin: [
    'adjustment',
    'vote_mvp',
    'player_image.add', 'player_image.set_profile', 'player_image.delete',
    'staff_image.add', 'staff_image.set_profile', 'staff_image.delete',
  ],
};

export const logsRoutes: FastifyPluginAsync = async (app) => {
  // GET /admin/logs — listar registros del sistema (superadmin only)
  app.get(
    '/admin/logs',
    { preHandler: [requireAuth, requireRole('superadmin')] },
    async (request, reply) => {
      const query = request.query as Record<string, string>;
      const filter = query.filter ?? 'all';
      const limit = Math.min(parseInt(query.limit ?? '100', 10), 200);
      const offset = Math.max(parseInt(query.offset ?? '0', 10), 0);

      const actions = filter !== 'all' ? (FILTER_ACTIONS[filter] ?? []) : undefined;

      const result = await getLogs({ limit, offset, actions });
      return reply.send(result);
    },
  );
};
