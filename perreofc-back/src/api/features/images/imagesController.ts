/**
 * Handles HTTP request and response logic for the images backend feature.
 * It delegates database work to services and keeps route handlers focused on API behavior.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { NotFoundError } from '../../errors.js';
import {
  playerIdParams,
  staffIdParams,
  newsIdParams,
  imageWithEntityParams,
  addImageBody,
  setNewsImageBody,
} from './imagesSchema.js';
import {
  getPlayerImages,
  addPlayerImage,
  setPlayerProfileImage,
  softDeletePlayerImage,
  getStaffImages,
  addStaffImage,
  setStaffProfileImage,
  softDeleteStaffImage,
  setNewsImage,
  clearNewsImage,
} from './imagesServices.js';

function handleErr(err: unknown, reply: FastifyReply) {
  if (err instanceof NotFoundError) {
    return reply.code(404).send({ success: false, error: err.message });
  }
  throw err;
}

// ─── Player Images ────────────────────────────────────────────────────────────

export async function getPlayerImagesHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = playerIdParams.safeParse(req.params);
  if (!params.success) return reply.code(400).send({ success: false, error: 'ID de jugador inválido' });

  try {
    const data = await getPlayerImages(params.data.id);
    return reply.send({ success: true, data });
  } catch (err) {
    return handleErr(err, reply);
  }
}

export async function addPlayerImageHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = playerIdParams.safeParse(req.params);
  const body = addImageBody.safeParse(req.body);
  if (!params.success || !body.success) {
    return reply.code(400).send({ success: false, error: 'Datos inválidos' });
  }

  try {
    const data = await addPlayerImage(params.data.id, body.data, req.user!.id, req.user!.username);
    return reply.code(201).send({ success: true, data });
  } catch (err) {
    return handleErr(err, reply);
  }
}

export async function setPlayerProfileHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = imageWithEntityParams.safeParse(req.params);
  if (!params.success) return reply.code(400).send({ success: false, error: 'Parámetros inválidos' });

  try {
    await setPlayerProfileImage(params.data.id, params.data.imageId, req.user!.id, req.user!.username);
    return reply.send({ success: true, data: null });
  } catch (err) {
    return handleErr(err, reply);
  }
}

export async function deletePlayerImageHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = imageWithEntityParams.safeParse(req.params);
  if (!params.success) return reply.code(400).send({ success: false, error: 'Parámetros inválidos' });

  try {
    await softDeletePlayerImage(params.data.id, params.data.imageId, req.user!.id, req.user!.username);
    return reply.send({ success: true, data: null });
  } catch (err) {
    return handleErr(err, reply);
  }
}

// ─── Staff Images ─────────────────────────────────────────────────────────────

export async function getStaffImagesHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = staffIdParams.safeParse(req.params);
  if (!params.success) return reply.code(400).send({ success: false, error: 'ID de staff inválido' });

  try {
    const data = await getStaffImages(params.data.id);
    return reply.send({ success: true, data });
  } catch (err) {
    return handleErr(err, reply);
  }
}

export async function addStaffImageHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = staffIdParams.safeParse(req.params);
  const body = addImageBody.safeParse(req.body);
  if (!params.success || !body.success) {
    return reply.code(400).send({ success: false, error: 'Datos inválidos' });
  }

  try {
    const data = await addStaffImage(params.data.id, body.data, req.user!.id, req.user!.username);
    return reply.code(201).send({ success: true, data });
  } catch (err) {
    return handleErr(err, reply);
  }
}

export async function setStaffProfileHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = imageWithEntityParams.safeParse(req.params);
  if (!params.success) return reply.code(400).send({ success: false, error: 'Parámetros inválidos' });

  try {
    await setStaffProfileImage(params.data.id, params.data.imageId, req.user!.id, req.user!.username);
    return reply.send({ success: true, data: null });
  } catch (err) {
    return handleErr(err, reply);
  }
}

export async function deleteStaffImageHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = imageWithEntityParams.safeParse(req.params);
  if (!params.success) return reply.code(400).send({ success: false, error: 'Parámetros inválidos' });

  try {
    await softDeleteStaffImage(params.data.id, params.data.imageId, req.user!.id, req.user!.username);
    return reply.send({ success: true, data: null });
  } catch (err) {
    return handleErr(err, reply);
  }
}

// ─── News Image ───────────────────────────────────────────────────────────────

export async function setNewsImageHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = newsIdParams.safeParse(req.params);
  const body = setNewsImageBody.safeParse(req.body);
  if (!params.success || !body.success) {
    return reply.code(400).send({ success: false, error: 'Datos inválidos' });
  }

  try {
    await setNewsImage(params.data.id, body.data.url);
    return reply.send({ success: true, data: { imageUrl: body.data.url } });
  } catch (err) {
    return handleErr(err, reply);
  }
}

export async function clearNewsImageHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = newsIdParams.safeParse(req.params);
  if (!params.success) return reply.code(400).send({ success: false, error: 'ID inválido' });

  try {
    await clearNewsImage(params.data.id);
    return reply.send({ success: true, data: null });
  } catch (err) {
    return handleErr(err, reply);
  }
}
