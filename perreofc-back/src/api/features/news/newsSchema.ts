/**
 * Defines validation schemas for the news backend feature.
 * These schemas protect the API by checking params, queries and request bodies before use.
 */

import { z } from 'zod';

export const getNewsQuerySchema = z.object({
  category: z.string().optional(),
  featured: z.coerce.boolean().optional(),  // se mapea a is_featured en el servicio
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  sortBy: z.enum(['publishedAt', 'createdAt']).default('publishedAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export const newsIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createNewsSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  imageUrl: z.string().url().nullable().optional(),
  category: z.string().min(1).max(50),
  isFeatures: z.boolean().default(false),
  publishedAt: z.string().datetime().nullable().optional(),
});

export const updateNewsSchema = createNewsSchema.partial();




