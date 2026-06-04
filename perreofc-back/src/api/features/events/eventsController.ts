/**
 * Handles HTTP request and response logic for the events backend feature.
 * It delegates database work to services and keeps route handlers focused on API behavior.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { getEventsQuerySchema, eventIdParamsSchema, createEventSchema, updateEventSchema } from './eventsSchema.js';
import { getEvents, getEventById, createEvent, updateEvent, deleteEvent } from './eventsServices.js';
import { NotFoundError, ForbiddenError } from '../../errors.js';
import type { UserRole } from '../auth/authMiddleware.js';

function handleErr(err: any, reply: FastifyReply) {
  if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
  if (err instanceof ForbiddenError) return reply.code(403).send({ error: err.message });
  throw err;
}

/** Obtiene lista de eventos filtrados por fecha, tipo y visibilidad del rol del usuario. */
export async function getEventsHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = getEventsQuerySchema.safeParse(req.query);
  if (!parsed.success) return reply.code(400).send({ error: 'Query inválida' });
  return getEvents(req.user!.role as UserRole, parsed.data);
}

/** Obtiene un evento específico por ID verificando permisos de visibilidad. */
export async function getEventByIdHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = eventIdParamsSchema.safeParse(req.params);
  if (!parsed.success) return reply.code(400).send({ error: 'ID inválido' });
  try { return await getEventById(parsed.data.id, req.user!.role as UserRole); }
  catch (err) { return handleErr(err, reply); }
}

/** Crea un evento nuevo asociado a un partido opcional y con roles de visibilidad. */
export async function createEventHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Body inválido', details: parsed.error.flatten() });
  return reply.code(201).send(await createEvent(req.user!.id, req.user!.username, parsed.data as any));
}

/** Actualiza evento existente (campos parciales) verificando permisos. */
export async function updateEventHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = eventIdParamsSchema.safeParse(req.params);
  const body = updateEventSchema.safeParse(req.body);
  if (!params.success || !body.success) {
    req.log.warn({ paramsError: params.error?.flatten(), bodyError: body.error?.flatten() }, 'updateEvent validation failed');
    return reply.code(400).send({ error: 'Datos inválidos', details: body.error?.flatten() });
  }
  try { return await updateEvent(req.user!.id, req.user!.username, params.data.id, body.data as any); }
  catch (err) { return handleErr(err, reply); }
}

/** Elimina evento con soft-delete (marca deleted_at). */
export async function deleteEventHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = eventIdParamsSchema.safeParse(req.params);
  if (!parsed.success) return reply.code(400).send({ error: 'ID inválido' });
  try { await deleteEvent(req.user!.id, req.user!.username, parsed.data.id); return reply.code(204).send(); }
  catch (err) { return handleErr(err, reply); }
}





