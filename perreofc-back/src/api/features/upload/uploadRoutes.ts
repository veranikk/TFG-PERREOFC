/**
 * Registers the Fastify endpoints for the upload backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { requireAuth, requireRole } from '../auth/authMiddleware.js';
import {
  uploadPlayerPhotoHandler,
  uploadStaffPhotoHandler,
  uploadNewsImageHandler,
  uploadMediaHandler,
  uploadAlbumPhotosHandler,
  uploadAlbumPhotosFromUrlsHandler,
  uploadFromUrlHandler,
  uploadAvatarHandler,
} from './uploadController.js';

const ADMIN_OR_STAFF = [requireAuth, requireRole('admin', 'superadmin')];

export const uploadRoutes: FastifyPluginAsync = async (app) => {
  app.post('/upload/player/:playerId', { preHandler: ADMIN_OR_STAFF }, uploadPlayerPhotoHandler);
  app.post('/upload/staff/:staffId',   { preHandler: ADMIN_OR_STAFF }, uploadStaffPhotoHandler);
  app.post('/upload/news/:articleId',  { preHandler: ADMIN_OR_STAFF }, uploadNewsImageHandler);
  app.post('/upload/media',                         { preHandler: requireAuth },     uploadMediaHandler);
  app.post('/upload/album/:albumId',                { preHandler: ADMIN_OR_STAFF }, uploadAlbumPhotosHandler);
  app.post('/upload/album/:albumId/from-urls',      { preHandler: ADMIN_OR_STAFF }, uploadAlbumPhotosFromUrlsHandler);
  app.post('/upload/from-url',                      { preHandler: ADMIN_OR_STAFF }, uploadFromUrlHandler);
  app.post('/upload/avatar',                        { preHandler: requireAuth },    uploadAvatarHandler);
};
