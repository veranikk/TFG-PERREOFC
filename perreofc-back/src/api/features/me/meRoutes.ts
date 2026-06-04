/**
 * Registers the Fastify endpoints for the me backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../auth/authMiddleware.js';
import {
  getMe,
  updateProfileHandler,
  changePasswordHandler,
  getNotifPrefsHandler,
  updateNotifPrefsHandler,
  getNotificationsEnabledHandler,
  setNotificationsEnabledHandler,
  savePushTokenHandler,
} from './meController.js';

export const meRoutes: FastifyPluginAsync = async (app) => {
  app.get('/me', { preHandler: requireAuth }, getMe);
  app.patch('/me', { preHandler: requireAuth }, updateProfileHandler);
  app.patch('/me/password', { preHandler: requireAuth }, changePasswordHandler);
  app.get('/me/notifications/preferences', { preHandler: requireAuth }, getNotifPrefsHandler);
  app.patch('/me/notifications/preferences', { preHandler: requireAuth }, updateNotifPrefsHandler);
  app.get('/me/notifications/enabled', { preHandler: requireAuth }, getNotificationsEnabledHandler);
  app.patch('/me/notifications/enabled', { preHandler: requireAuth }, setNotificationsEnabledHandler);
  app.post('/me/push-token', { preHandler: requireAuth }, savePushTokenHandler);
};




