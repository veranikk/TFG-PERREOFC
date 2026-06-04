/**
 * Handles HTTP request and response logic for the news backend feature.
 * It delegates database work to services and keeps route handlers focused on API behavior.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { createCategorySchema, categoryIdParamsSchema } from './newsCategoriesSchema.js';
import { getCategories, createCategory, deleteCategory } from './newsCategoriesServices.js';
import { NotFoundError, ConflictError } from '../../errors.js';

function handleErr(err: any, reply: FastifyReply) {
  if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
  if (err instanceof ConflictError)  return reply.code(409).send({ error: err.message });
  throw err;
}

export async function getCategoriesHandler(req: FastifyRequest, reply: FastifyReply) {
  return getCategories();
}

export async function createCategoryHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Body inválido', details: parsed.error.flatten() });
  try {
    return reply.code(201).send(await createCategory(req.user!.id, req.user!.username, parsed.data));
  } catch (err) { return handleErr(err, reply); }
}

export async function deleteCategoryHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = categoryIdParamsSchema.safeParse(req.params);
  if (!parsed.success) return reply.code(400).send({ error: 'ID inválido' });
  try {
    await deleteCategory(req.user!.id, req.user!.username, parsed.data.id);
    return reply.code(204).send();
  } catch (err) { return handleErr(err, reply); }
}
