/**
 * Handles HTTP request and response logic for the news backend feature.
 * It delegates database work to services and keeps route handlers focused on API behavior.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { getNewsQuerySchema, newsIdParamsSchema, createNewsSchema, updateNewsSchema } from './newsSchema.js';
import { getNews, getNewsById, createNews, updateNews, deleteNews } from './newsServices.js';
import { NotFoundError } from '../../errors.js';

function handleErr(err: any, reply: FastifyReply) {
  if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
  throw err;
}

export async function getNewsHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = getNewsQuerySchema.safeParse(req.query);
  if (!parsed.success) return reply.code(400).send({ error: 'Query inválida' });
  return getNews(parsed.data);
}

export async function getNewsByIdHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = newsIdParamsSchema.safeParse(req.params);
  if (!parsed.success) return reply.code(400).send({ error: 'ID inválido' });
  try { return await getNewsById(parsed.data.id); } catch (err) { return handleErr(err, reply); }
}

export async function createNewsHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = createNewsSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Body inválido', details: parsed.error.flatten() });
  return reply.code(201).send(await createNews(req.user!.id, req.user!.username, parsed.data as any));
}

export async function updateNewsHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = newsIdParamsSchema.safeParse(req.params);
  const body = updateNewsSchema.safeParse(req.body);
  if (!params.success || !body.success) return reply.code(400).send({ error: 'Datos inválidos' });
  try { return await updateNews(req.user!.id, req.user!.username, params.data.id, body.data as any); } catch (err) { return handleErr(err, reply); }
}

export async function deleteNewsHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = newsIdParamsSchema.safeParse(req.params);
  if (!parsed.success) return reply.code(400).send({ error: 'ID inválido' });
  try { await deleteNews(req.user!.id, req.user!.username, parsed.data.id); return reply.code(204).send(); }
  catch (err) { return handleErr(err, reply); }
}





