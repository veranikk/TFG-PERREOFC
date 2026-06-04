/**
 * Defines validation schemas for the upload backend feature.
 * These schemas protect the API by checking params, queries and request bodies before use.
 */

import { z } from 'zod';

export const playerUploadParams = z.object({
  playerId: z.coerce.number().int().positive(),
});

export const staffUploadParams = z.object({
  staffId: z.coerce.number().int().positive(),
});

export const newsUploadParams = z.object({
  articleId: z.string().uuid(),
});

export const fromUrlBody = z.object({
  url: z.string().url(),
  bucket: z.string().min(1),
  path: z.string().min(1),
});

export const albumPhotosFromUrlsBody = z.object({
  urls: z.array(z.string().url()).min(1).max(50),
});
