/**
 * Handles HTTP request and response logic for the notifications backend feature.
 * It delegates database work to services and keeps route handlers focused on API behavior.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { NotFoundError } from '../../errors.js';
import {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead,
  broadcastNotification,
} from './notificationsServices.js';

const notificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const notificationParamsSchema = z.object({
  notificationId: z.string().uuid(),
});

const broadcastSchema = z.object({
  segment: z.enum(['all', 'aficionados', 'jugadores', 'admins']),
  title: z.string().min(1).max(60),
  body: z.string().min(1).max(200),
});

function handleError(err: any, reply: FastifyReply) {
  if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
  throw err;
}

export async function getNotificationsHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = notificationsQuerySchema.safeParse(req.query);
  if (!query.success) {
    return reply.code(400).send({ error: 'Query inválida', details: query.error.flatten() });
  }

  try {
    return await getNotifications(req.user!.id, query.data.page, query.data.limit);
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function getUnreadNotificationsHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = notificationsQuerySchema.safeParse(req.query);
  if (!query.success) {
    return reply.code(400).send({ error: 'Query inválida', details: query.error.flatten() });
  }

  try {
    return await getUnreadNotifications(req.user!.id, query.data.page, query.data.limit);
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function getUnreadCountHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    return await getUnreadCount(req.user!.id);
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function markNotificationAsReadHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = notificationParamsSchema.safeParse(req.params);
  if (!params.success) {
    return reply.code(400).send({ error: 'Parámetros inválidos', details: params.error.flatten() });
  }

  try {
    return await markNotificationAsRead(req.user!.id, params.data.notificationId);
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function deleteNotificationHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = notificationParamsSchema.safeParse(req.params);
  if (!params.success) {
    return reply.code(400).send({ error: 'Parámetros inválidos', details: params.error.flatten() });
  }

  try {
    return await deleteNotification(req.user!.id, params.data.notificationId);
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function markAllNotificationsAsReadHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    return await markAllNotificationsAsRead(req.user!.id);
  } catch (err) {
    return handleError(err, reply);
  }
}

export async function broadcastNotificationHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = broadcastSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Body inválido', details: parsed.error.flatten() });
  }

  try {
    const result = await broadcastNotification(parsed.data.segment, parsed.data.title, parsed.data.body);
    return result;
  } catch (err: any) {
    req.log.error({ err }, 'Error en broadcast de notificaciones');
    return reply.code(500).send({ error: err?.message ?? 'Error interno al enviar notificaciones' });
  }
}
