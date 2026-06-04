/**
 * Registers the Fastify endpoints for the albums backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { requireAuth, requireRole } from '../auth/authMiddleware.js';
import {
  getAlbumsHandler,
  getAlbumByIdHandler,
  createAlbumHandler,
  updateAlbumHandler,
  deleteAlbumHandler,
  getAlbumPhotosHandler,
  addPhotoHandler,
  updatePhotoHandler,
  deletePhotoHandler,
  setAlbumCoverHandler,
} from './albumsController.js';

const ADMIN_ONLY = [requireAuth, requireRole('admin', 'superadmin')];

export const albumsRoutes: FastifyPluginAsync = async (app) => {
  // ── Álbumes ───────────────────────────────────────────────────────────────
  app.get('/albums',     { preHandler: requireAuth },   getAlbumsHandler);
  app.get('/albums/:id', { preHandler: requireAuth },   getAlbumByIdHandler);
  app.post('/albums',    { preHandler: ADMIN_ONLY },    createAlbumHandler);
  app.patch('/albums/:id',  { preHandler: ADMIN_ONLY }, updateAlbumHandler);
  app.delete('/albums/:id', { preHandler: ADMIN_ONLY }, deleteAlbumHandler);

  // ── Fotos ─────────────────────────────────────────────────────────────────
  app.get('/albums/:id/photos',                           { preHandler: requireAuth },  getAlbumPhotosHandler);
  app.post('/albums/:id/photos',                          { preHandler: ADMIN_ONLY },   addPhotoHandler);
  app.patch('/albums/:id/photos/:photoId',                { preHandler: ADMIN_ONLY },   updatePhotoHandler);
  app.delete('/albums/:id/photos/:photoId',               { preHandler: ADMIN_ONLY },   deletePhotoHandler);
  app.patch('/albums/:id/photos/:photoId/set-cover',      { preHandler: ADMIN_ONLY },   setAlbumCoverHandler);
};
