/**
 * Handles HTTP request and response logic for the albums backend feature.
 * It delegates database work to services and keeps route handlers focused on API behavior.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  albumIdParamsSchema,
  photoIdParamsSchema,
  getAlbumsQuerySchema,
  createAlbumSchema,
  updateAlbumSchema,
  addPhotoSchema,
  updatePhotoSchema,
} from './albumsSchema.js';
import {
  getAlbums,
  getAlbumById,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  getAlbumPhotos,
  addPhoto,
  updatePhoto,
  deletePhoto,
  setAlbumCover,
} from './albumsServices.js';
import { NotFoundError } from '../../errors.js';

function handleErr(err: any, reply: FastifyReply) {
  if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
  throw err;
}

// ─── Albums ───────────────────────────────────────────────────────────────────

export async function getAlbumsHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = getAlbumsQuerySchema.safeParse(req.query);
  if (!parsed.success) return reply.code(400).send({ error: 'Query inválida' });
  return getAlbums(parsed.data);
}

export async function getAlbumByIdHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = albumIdParamsSchema.safeParse(req.params);
  if (!parsed.success) return reply.code(400).send({ error: 'ID inválido' });
  try { return await getAlbumById(parsed.data.id); } catch (err) { return handleErr(err, reply); }
}

export async function createAlbumHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = createAlbumSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Body inválido', details: parsed.error.flatten() });
  try {
    const album = await createAlbum(req.user!.id, req.user!.username, parsed.data as any);
    return reply.code(201).send(album);
  } catch (err) { return handleErr(err, reply); }
}

export async function updateAlbumHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = albumIdParamsSchema.safeParse(req.params);
  const body   = updateAlbumSchema.safeParse(req.body);
  if (!params.success || !body.success) return reply.code(400).send({ error: 'Datos inválidos' });
  try { return await updateAlbum(req.user!.id, req.user!.username, params.data.id, body.data as any); }
  catch (err) { return handleErr(err, reply); }
}

export async function deleteAlbumHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = albumIdParamsSchema.safeParse(req.params);
  if (!parsed.success) return reply.code(400).send({ error: 'ID inválido' });
  try {
    await deleteAlbum(req.user!.id, req.user!.username, parsed.data.id);
    return reply.code(204).send();
  } catch (err) { return handleErr(err, reply); }
}

// ─── Photos ───────────────────────────────────────────────────────────────────

export async function getAlbumPhotosHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = albumIdParamsSchema.safeParse(req.params);
  if (!parsed.success) return reply.code(400).send({ error: 'ID inválido' });
  try { return await getAlbumPhotos(parsed.data.id); } catch (err) { return handleErr(err, reply); }
}

export async function addPhotoHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = albumIdParamsSchema.safeParse(req.params);
  const body   = addPhotoSchema.safeParse(req.body);
  if (!params.success || !body.success) return reply.code(400).send({ error: 'Datos inválidos', details: body.error?.flatten() });
  try {
    const photo = await addPhoto(req.user!.id, req.user!.username, params.data.id, body.data as any);
    return reply.code(201).send(photo);
  } catch (err) { return handleErr(err, reply); }
}

export async function updatePhotoHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = photoIdParamsSchema.safeParse(req.params);
  const body   = updatePhotoSchema.safeParse(req.body);
  if (!params.success || !body.success) return reply.code(400).send({ error: 'Datos inválidos' });
  try { return await updatePhoto(req.user!.id, req.user!.username, params.data.id, params.data.photoId, body.data as any); }
  catch (err) { return handleErr(err, reply); }
}

export async function deletePhotoHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = photoIdParamsSchema.safeParse(req.params);
  if (!parsed.success) return reply.code(400).send({ error: 'ID inválido' });
  try {
    await deletePhoto(req.user!.id, req.user!.username, parsed.data.id, parsed.data.photoId);
    return reply.code(204).send();
  } catch (err) { return handleErr(err, reply); }
}

export async function setAlbumCoverHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = photoIdParamsSchema.safeParse(req.params);
  if (!parsed.success) return reply.code(400).send({ error: 'ID inválido' });
  try {
    await setAlbumCover(req.user!.id, req.user!.username, parsed.data.id, parsed.data.photoId);
    return reply.code(204).send();
  } catch (err) { return handleErr(err, reply); }
}
