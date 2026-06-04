/**
 * Registers the Fastify endpoints for the news backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../auth/authMiddleware.js';
import { requireRole } from '../auth/authMiddleware.js';
import { getNewsHandler, getNewsByIdHandler, createNewsHandler, updateNewsHandler, deleteNewsHandler } from './newsController.js';
import { getCategoriesHandler, createCategoryHandler, deleteCategoryHandler } from './newsCategoriesController.js';

export const newsRoutes: FastifyPluginAsync = async (app) => {
  // ── Categorías (rutas estáticas primero para evitar conflicto con /:id) ──────
  app.get('/news/categories',        { preHandler: requireAuth }, getCategoriesHandler);
  app.post('/news/categories',       { preHandler: [requireAuth, requireRole('admin', 'superadmin')] }, createCategoryHandler);
  app.delete('/news/categories/:id', { preHandler: [requireAuth, requireRole('admin', 'superadmin')] }, deleteCategoryHandler);

  // ── Artículos ─────────────────────────────────────────────────────────────────
  app.get('/news',        { preHandler: requireAuth }, getNewsHandler);
  app.get('/news/:id',    { preHandler: requireAuth }, getNewsByIdHandler);
  app.post('/news',       { preHandler: [requireAuth, requireRole('admin', 'superadmin')] }, createNewsHandler);
  app.patch('/news/:id',  { preHandler: [requireAuth, requireRole('admin', 'superadmin')] }, updateNewsHandler);
  app.delete('/news/:id', { preHandler: [requireAuth, requireRole('admin', 'superadmin')] }, deleteNewsHandler);
};




