/**
 * Registers the Fastify endpoints for the chat backend feature.
 * It connects URL paths, validation middleware and controller/service handlers.
 */

import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { requireAuth } from '../auth/authMiddleware.js';
import { N8nTimeoutError, N8nUnavailableError, processMessage, resetSession } from './chatServices.js';

const MAX_MESSAGE_LENGTH = 1000;

export const chatRoutes: FastifyPluginAsync = async (app) => {
  // POST /chat/message — enviar un mensaje al agente IA
  app.post<{ Body: { message?: string } }>(
    '/message',
    { preHandler: requireAuth },
    async (req, reply) => {
      const { message } = req.body;

      if (typeof message !== 'string' || message.trim().length === 0) {
        return reply.code(400).send({
          error: 'El mensaje no puede estar vacío',
          code: 'EMPTY_MESSAGE',
        });
      }

      if (message.length > MAX_MESSAGE_LENGTH) {
        return reply.code(400).send({
          error: `El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres`,
          code: 'MESSAGE_TOO_LONG',
        });
      }

      try {
        const result = await processMessage(
          req.user!.id,
          req.user!.role,
          message.trim(),
        );

        return reply.code(200).send({
          session_id: result.session_id,
          message: {
            id: result.message.id,
            content: result.message.content,
            created_at: result.message.created_at,
          },
        });
      } catch (err) {
        if (err instanceof N8nTimeoutError || err instanceof N8nUnavailableError) {
          return reply.code(502).send({
            error: 'El agente no está disponible en este momento',
            code: 'AGENT_UNAVAILABLE',
          });
        }
        throw err;
      }
    },
  );
  // DELETE /chat/session — cerrar sesión activa para empezar de cero
  app.delete(
    '/session',
    { preHandler: requireAuth },
    async (req, reply) => {
      await resetSession(req.user!.id);
      return reply.code(204).send();
    },
  );
};
