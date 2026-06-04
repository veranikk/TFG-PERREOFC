/**
 * Registers the Fastify endpoints for the auth backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync } from 'fastify';
import {
  loginHandler,
  registerHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  refreshHandler,
  changePasswordHandler,
  changePasswordStatusHandler,
  verifyCurrentPasswordHandler,
  verifyOtpHandler,
  resetPasswordWithOtpHandler,
} from './authController.js';
import { requireAuth } from './authMiddleware.js';

export const authRoutes: FastifyPluginAsync = async (app) => {
  // POST /auth/login — máx 10 intentos/min por IP para frenar brute-force
  app.post('/login', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
        errorResponseBuilder: () => ({
          error: 'Demasiados intentos de login. Espera 1 minuto e inténtalo de nuevo.',
          code: 'RATE_LIMIT_EXCEEDED',
        }),
      },
    },
  }, loginHandler);

  // POST /auth/register — máx 5 registros/min por IP para frenar spam de cuentas
  app.post('/register', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
        errorResponseBuilder: () => ({
          error: 'Demasiadas cuentas creadas desde esta IP. Inténtalo más tarde.',
          code: 'RATE_LIMIT_EXCEEDED',
        }),
      },
    },
  }, registerHandler);

  // POST /auth/forgot-password
  app.post('/forgot-password', forgotPasswordHandler);

  // POST /auth/reset-password
  app.post('/reset-password', resetPasswordHandler);

  // POST /auth/refresh
  app.post('/refresh', refreshHandler);

  // POST /auth/change-password (requires JWT)
  app.post('/change-password', { preHandler: requireAuth }, changePasswordHandler);

  // GET /auth/change-password/status (requires JWT)
  app.get('/change-password/status', { preHandler: requireAuth }, changePasswordStatusHandler);

  // POST /auth/verify-password (requires JWT)
  app.post('/verify-password', { preHandler: requireAuth }, verifyCurrentPasswordHandler);

  // POST /auth/verify-otp
  app.post('/verify-otp', verifyOtpHandler);

  // POST /auth/reset-password-otp
  app.post('/reset-password-otp', resetPasswordWithOtpHandler);
};





