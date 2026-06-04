/**
 * Defines validation schemas for the images backend feature.
 * These schemas protect the API by checking params, queries and request bodies before use.
 */

import { z } from 'zod';

export const playerIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const staffIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const newsIdParams = z.object({
  id: z.string().uuid(),
});

export const imageWithEntityParams = z.object({
  id: z.coerce.number().int().positive(),
  imageId: z.string().min(1),
});

export const addImageBody = z.object({
  url: z.string().url(),
  is_profile: z.boolean().default(false),
  description: z.string().optional(),
  taken_at: z.string().datetime().optional(),
});

export const setNewsImageBody = z.object({
  url: z.string().url(),
});
