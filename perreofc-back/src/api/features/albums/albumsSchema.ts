/**
 * Defines validation schemas for the albums backend feature.
 * These schemas protect the API by checking params, queries and request bodies before use.
 */

import { z } from 'zod';

export const albumIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const photoIdParamsSchema = z.object({
  id:      z.string().uuid(),
  photoId: z.string().uuid(),
});

export const getAlbumsQuerySchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const createAlbumSchema = z.object({
  title:       z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  coverUrl:    z.string().url().nullable().optional(),
  eventDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export const updateAlbumSchema = createAlbumSchema.partial();

export const addPhotoSchema = z.object({
  url:         z.string().url(),
  thumbnailUrl: z.string().url().nullable().optional(),
  description: z.string().nullable().optional(),
  location:    z.string().max(255).nullable().optional(),
  type:        z.enum(['photo', 'video']).default('photo'),
  takenAt:     z.string().datetime().nullable().optional(),
});

export const updatePhotoSchema = z.object({
  description: z.string().nullable().optional(),
  location:    z.string().max(255).nullable().optional(),
  takenAt:     z.string().datetime().nullable().optional(),
});
