/**
 * Handles HTTP request and response logic for the events backend feature.
 * It delegates database work to services and keeps route handlers focused on API behavior.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { createEventCategorySchema, eventCategoryIdParamsSchema } from './eventCategoriesSchema.js';
import { getEventCategories, createEventCategory, deleteEventCategory } from './eventCategoriesServices.js';
import { NotFoundError, ConflictError } from '../../errors.js';

function handleErr(err: any, reply: FastifyReply) {
  if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
  if (err instanceof ConflictError)  return reply.code(409).send({ error: err.message });
  throw err;
}

export async function getEventCategoriesHandler(req: FastifyRequest, reply: FastifyReply) {
  return getEventCategories();
}

export async function createEventCategoryHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = createEventCategorySchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Body inválido', details: parsed.error.flatten() });
  try {
    return reply.code(201).send(await createEventCategory(req.user!.id, req.user!.username, parsed.data));
  } catch (err) { return handleErr(err, reply); }
}

export async function deleteEventCategoryHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = eventCategoryIdParamsSchema.safeParse(req.params);
  if (!parsed.success) return reply.code(400).send({ error: 'ID inválido' });
  try {
    await deleteEventCategory(req.user!.id, req.user!.username, parsed.data.id);
    return reply.code(204).send();
  } catch (err) { return handleErr(err, reply); }
}
