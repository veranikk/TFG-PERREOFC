/**
 * Handles HTTP request and response logic for the upload backend feature.
 * It delegates database work to services and keeps route handlers focused on API behavior.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { BadRequestError, NotFoundError } from '../../errors.js';
import { playerUploadParams, staffUploadParams, newsUploadParams, fromUrlBody, albumPhotosFromUrlsBody } from './uploadSchema.js';
import { uploadFileToStorage, uploadFromUrl } from './uploadServices.js';
import { addPhoto } from '../albums/albumsServices.js';

// ─── Shared multipart handler ─────────────────────────────────────────────────

async function handleMultipartUpload(
  req: FastifyRequest,
  reply: FastifyReply,
  bucket: string,
  buildPath: (filename: string) => string,
) {
  let part: Awaited<ReturnType<typeof req.file>>;
  try {
    part = await req.file();
  } catch {
    return reply.code(400).send({ success: false, error: 'Se esperaba un archivo multipart/form-data' });
  }

  if (!part) {
    return reply.code(400).send({ success: false, error: 'No se recibió ningún archivo' });
  }

  const ext = (part.filename.split('.').pop() ?? 'bin').toLowerCase();
  const safeName = `${Date.now()}.${ext}`;
  const storagePath = buildPath(safeName);

  try {
    const result = await uploadFileToStorage(bucket, storagePath, part.file, part.mimetype);
    return reply.code(201).send({ success: true, data: result });
  } catch (err: any) {
    req.log.error({ bucket, storagePath, errMsg: err.message }, 'uploadFileToStorage failed');
    return reply.code(500).send({ success: false, error: err.message });
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export async function uploadPlayerPhotoHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = playerUploadParams.safeParse(req.params);
  if (!params.success) return reply.code(400).send({ success: false, error: 'ID de jugador inválido' });

  return handleMultipartUpload(req, reply, 'player-photos', (name) => `${params.data.playerId}/${name}`);
}

export async function uploadStaffPhotoHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = staffUploadParams.safeParse(req.params);
  if (!params.success) return reply.code(400).send({ success: false, error: 'ID de staff inválido' });

  return handleMultipartUpload(req, reply, 'staff-photos', (name) => `${params.data.staffId}/${name}`);
}

export async function uploadNewsImageHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = newsUploadParams.safeParse(req.params);
  if (!params.success) return reply.code(400).send({ success: false, error: 'ID de artículo inválido' });

  return handleMultipartUpload(req, reply, 'news-images', (name) => `${params.data.articleId}/${name}`);
}

export async function uploadMediaHandler(req: FastifyRequest, reply: FastifyReply) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  return handleMultipartUpload(req, reply, 'media-gallery', (name) => `${year}/${month}/${name}`);
}

export async function uploadAlbumPhotosHandler(req: FastifyRequest, reply: FastifyReply) {
  const albumId = (req.params as any)?.albumId as string | undefined;
  if (!albumId) return reply.code(400).send({ success: false, error: 'ID de álbum inválido' });
  const description = ((req.query as any)?.description as string | undefined) || null;

  let parts: ReturnType<typeof req.files>;
  try {
    parts = req.files();
  } catch {
    return reply.code(400).send({ success: false, error: 'Se esperaba un archivo multipart/form-data' });
  }

  const uploaded: any[] = [];
  const errors: Array<{ filename: string; error: string }> = [];

  for await (const part of parts) {
    const ext = (part.filename.split('.').pop() ?? 'bin').toLowerCase();
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const storagePath = `albums/${albumId}/${safeName}`;
    const mediaType: 'photo' | 'video' = part.mimetype.startsWith('video/') ? 'video' : 'photo';

    try {
      const result = await uploadFileToStorage('media-gallery', storagePath, part.file, part.mimetype);
      const photo = await addPhoto(req.user!.id, req.user!.username, albumId, {
        url:         result.publicUrl,
        type:        mediaType,
        description: description,
      });
      uploaded.push(photo);
    } catch (err: any) {
      if (err instanceof NotFoundError) {
        return reply.code(404).send({ success: false, error: err.message });
      }
      errors.push({ filename: part.filename, error: err.message });
    }
  }

  if (uploaded.length === 0 && errors.length > 0) {
    return reply.code(500).send({ success: false, errors });
  }

  return reply.code(201).send({
    success: true,
    data: uploaded,
    ...(errors.length > 0 && { errors }),
  });
}

export async function uploadAlbumPhotosFromUrlsHandler(req: FastifyRequest, reply: FastifyReply) {
  const albumId = (req.params as any)?.albumId as string | undefined;
  if (!albumId) return reply.code(400).send({ success: false, error: 'ID de álbum inválido' });

  const parsed = albumPhotosFromUrlsBody.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ success: false, error: 'Body inválido', details: parsed.error.flatten() });
  }

  const uploaded: any[] = [];
  const errors: Array<{ url: string; error: string }> = [];

  for (const url of parsed.data.urls) {
    const cleanUrl = url.split('?')[0];
    const ext = (cleanUrl.split('.').pop() ?? 'jpg').toLowerCase().slice(0, 5);
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const storagePath = `albums/${albumId}/${safeName}`;

    try {
      const result = await uploadFromUrl(url, 'media-gallery', storagePath);
      const photo = await addPhoto(req.user!.id, req.user!.username, albumId, {
        url:  result.publicUrl,
        type: 'photo',
      });
      uploaded.push(photo);
    } catch (err: any) {
      if (err instanceof NotFoundError) {
        return reply.code(404).send({ success: false, error: err.message });
      }
      errors.push({ url, error: err.message });
    }
  }

  if (uploaded.length === 0 && errors.length > 0) {
    return reply.code(500).send({ success: false, errors });
  }

  return reply.code(201).send({
    success: true,
    data: uploaded,
    ...(errors.length > 0 && { errors }),
  });
}

export async function uploadAvatarHandler(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user!.id;
  return handleMultipartUpload(req, reply, 'user-avatars', (name) => `${userId}/${name}`);
}

export async function uploadFromUrlHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = fromUrlBody.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ success: false, error: 'Body inválido', details: parsed.error.flatten() });
  }

  try {
    const result = await uploadFromUrl(parsed.data.url, parsed.data.bucket, parsed.data.path);
    return reply.code(201).send({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof BadRequestError) {
      return reply.code(400).send({ success: false, error: err.message });
    }
    return reply.code(500).send({ success: false, error: err.message });
  }
}
