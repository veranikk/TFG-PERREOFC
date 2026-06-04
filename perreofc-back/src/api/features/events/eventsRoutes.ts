/**
 * Registers the Fastify endpoints for the events backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../auth/authMiddleware.js';
import { requireRole } from '../auth/authMiddleware.js';
import { getEventsHandler, getEventByIdHandler, createEventHandler, updateEventHandler, deleteEventHandler } from './eventsController.js';
import { getEventCategoriesHandler, createEventCategoryHandler, deleteEventCategoryHandler } from './eventCategoriesController.js';

export const eventsRoutes: FastifyPluginAsync = async (app) => {
  // Categorías (rutas estáticas antes de /:id)
  app.get('/events/categories', { preHandler: requireAuth }, getEventCategoriesHandler);
  app.post('/events/categories', { preHandler: [requireAuth, requireRole('admin', 'superadmin')] }, createEventCategoryHandler);
  app.delete('/events/categories/:id', { preHandler: [requireAuth, requireRole('admin', 'superadmin')] }, deleteEventCategoryHandler);

  // Eventos
  app.get('/events', { preHandler: requireAuth }, getEventsHandler);
  app.get('/events/:id', { preHandler: requireAuth }, getEventByIdHandler);
  app.post('/events', { preHandler: [requireAuth, requireRole('admin', 'superadmin')] }, createEventHandler);
  app.patch('/events/:id', { preHandler: [requireAuth, requireRole('admin', 'superadmin')] }, updateEventHandler);
  app.delete('/events/:id', { preHandler: [requireAuth, requireRole('superadmin')] }, deleteEventHandler);
};




