/**
 * Registers the Fastify endpoints for the users backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import { requireAuth, requireRole } from '../auth/authMiddleware.js';
import {
  deleteCurrentUserHandler,
  getPublicUserHandler,
  getUserStatsHandler,
  listUsersHandler,
  updateUserRoleHandler,
  hardDeleteUserHandler,
  adjustUserPointsHandler,
  getAdminUserHandler,
  createAdminUserHandler,
  getUnlinkedPlayersHandler,
  banUserHandler,
  requestDeleteAccountHandler,
  confirmDeleteAccountHandler,
  emailChangeStatusHandler,
  requestEmailChangeHandler,
  confirmEmailChangeHandler,
} from './usersController.js';

export const usersRoutes: FastifyPluginAsync = async (app) => {
  // DELETE /users/me — eliminar cuenta actual (soft delete, sin confirmación — legacy)
  app.delete('/users/me', { preHandler: requireAuth }, deleteCurrentUserHandler);

  // POST /users/me/delete-request — solicitar eliminación de cuenta (envía PIN al email)
  app.post('/users/me/delete-request', { preHandler: requireAuth }, requestDeleteAccountHandler);

  // POST /users/me/delete-confirm — confirmar eliminación de cuenta con PIN
  app.post('/users/me/delete-confirm', { preHandler: requireAuth }, confirmDeleteAccountHandler);

  // Cambio de correo (solo aficionados)
  // GET  /users/me/email-change/status  — estado del rate limit
  app.get('/users/me/email-change/status', { preHandler: requireAuth }, emailChangeStatusHandler);

  // POST /users/me/email-change/request — paso 1: verifica contraseña y envía PIN al nuevo correo
  app.post('/users/me/email-change/request', { preHandler: requireAuth }, requestEmailChangeHandler);

  // POST /users/me/email-change/confirm — paso 2: valida PIN del nuevo correo y aplica el cambio
  app.post('/users/me/email-change/confirm', { preHandler: requireAuth }, confirmEmailChangeHandler);

  // GET /users/:userId — perfil público de un usuario
  app.get('/users/:userId', { preHandler: requireAuth }, getPublicUserHandler);

  // GET /users/:userId/stats — estadísticas de apuestas del usuario
  app.get('/users/:userId/stats', { preHandler: requireAuth }, getUserStatsHandler);

  // Admin routes
  // GET /admin/users — listar todos los usuarios (admin only)
  app.get(
    '/admin/users',
    { preHandler: [requireAuth, requireRole('admin', 'superadmin')] },
    listUsersHandler,
  );

  // GET /admin/users/:userId — detalle con email (admin/superadmin)
  app.get(
    '/admin/users/:userId',
    { preHandler: [requireAuth, requireRole('admin', 'superadmin')] },
    getAdminUserHandler,
  );

  // PUT /admin/users/:userId — cambiar rol de usuario (admin only)
  app.put(
    '/admin/users/:userId',
    { preHandler: [requireAuth, requireRole('admin', 'superadmin')] },
    updateUserRoleHandler,
  );

  // DELETE /admin/users/:userId — eliminar usuario (superadmin only)
  app.delete(
    '/admin/users/:userId',
    { preHandler: [requireAuth, requireRole('superadmin')] },
    hardDeleteUserHandler,
  );

  // PATCH /admin/users/:userId/points — ajustar puntos (superadmin only)
  app.patch(
    '/admin/users/:userId/points',
    { preHandler: [requireAuth, requireRole('superadmin')] },
    adjustUserPointsHandler,
  );

  // GET /admin/players/unlinked — jugadores sin cuenta de usuario (admin/superadmin)
  app.get(
    '/admin/players/unlinked',
    { preHandler: [requireAuth, requireRole('admin', 'superadmin')] },
    getUnlinkedPlayersHandler,
  );

  // PATCH /admin/users/:userId/ban — banear/desbanear usuario (admin/superadmin)
  app.patch(
    '/admin/users/:userId/ban',
    { preHandler: [requireAuth, requireRole('admin', 'superadmin')] },
    banUserHandler,
  );

  // POST /admin/users — crear usuario desde panel admin (admin/superadmin)
  app.post(
    '/admin/users',
    { preHandler: [requireAuth, requireRole('admin', 'superadmin')] },
    createAdminUserHandler,
  );
};





