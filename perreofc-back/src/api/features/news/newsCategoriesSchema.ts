/**
 * Defines validation schemas for the news backend feature.
 * These schemas protect the API by checking params, queries and request bodies before use.
 */

import { z } from 'zod';

export const createCategorySchema = z.object({
  name:  z.string().min(1).max(50).transform(s => s.toUpperCase().trim()),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser hex #RRGGBB'),
});

export const categoryIdParamsSchema = z.object({
  id: z.string().uuid(),
});
