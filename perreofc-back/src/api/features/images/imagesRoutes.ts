/**
 * Registers the Fastify endpoints for the images backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { requireAuth, requireRole } from '../auth/authMiddleware.js';
import {
  getPlayerImagesHandler,
  addPlayerImageHandler,
  setPlayerProfileHandler,
  deletePlayerImageHandler,
  getStaffImagesHandler,
  addStaffImageHandler,
  setStaffProfileHandler,
  deleteStaffImageHandler,
  setNewsImageHandler,
  clearNewsImageHandler,
} from './imagesController.js';

const ADMIN_OR_STAFF = [requireAuth, requireRole('admin', 'superadmin')];

export const imagesRoutes: FastifyPluginAsync = async (app) => {
  // Player images
  app.get('/players/:id/images', { preHandler: requireAuth }, getPlayerImagesHandler);
  app.post('/players/:id/images', { preHandler: ADMIN_OR_STAFF }, addPlayerImageHandler);
  app.patch('/players/:id/images/:imageId/set-profile', { preHandler: ADMIN_OR_STAFF }, setPlayerProfileHandler);
  app.delete('/players/:id/images/:imageId', { preHandler: ADMIN_OR_STAFF }, deletePlayerImageHandler);

  // Staff images
  app.get('/staff/:id/images', { preHandler: requireAuth }, getStaffImagesHandler);
  app.post('/staff/:id/images', { preHandler: ADMIN_OR_STAFF }, addStaffImageHandler);
  app.patch('/staff/:id/images/:imageId/set-profile', { preHandler: ADMIN_OR_STAFF }, setStaffProfileHandler);
  app.delete('/staff/:id/images/:imageId', { preHandler: ADMIN_OR_STAFF }, deleteStaffImageHandler);

  // News image
  app.post('/news/:id/image', { preHandler: ADMIN_OR_STAFF }, setNewsImageHandler);
  app.delete('/news/:id/image', { preHandler: ADMIN_OR_STAFF }, clearNewsImageHandler);
};
