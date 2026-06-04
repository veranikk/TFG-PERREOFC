/**
 * Registers the Fastify endpoints for the notifications backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { requireAuth, requireRole } from '../auth/authMiddleware.js';
import {
  getNotificationsHandler,
  getUnreadNotificationsHandler,
  getUnreadCountHandler,
  markNotificationAsReadHandler,
  deleteNotificationHandler,
  markAllNotificationsAsReadHandler,
  broadcastNotificationHandler,
} from './notificationsController.js';

const ADMIN_ONLY = [requireAuth, requireRole('admin', 'superadmin')];

export const notificationsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/notifications', { preHandler: requireAuth }, getNotificationsHandler);
  app.get('/notifications/unread', { preHandler: requireAuth }, getUnreadNotificationsHandler);
  app.get('/notifications/unread-count', { preHandler: requireAuth }, getUnreadCountHandler);
  app.put('/notifications/:notificationId', { preHandler: requireAuth }, markNotificationAsReadHandler);
  app.delete('/notifications/:notificationId', { preHandler: requireAuth }, deleteNotificationHandler);
  app.post('/notifications/mark-all-read', { preHandler: requireAuth }, markAllNotificationsAsReadHandler);
  app.post('/notifications/broadcast', { preHandler: ADMIN_ONLY }, broadcastNotificationHandler);
};
