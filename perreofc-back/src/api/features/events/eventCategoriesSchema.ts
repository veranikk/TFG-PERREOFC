/**
 * Defines validation schemas for the events backend feature.
 * These schemas protect the API by checking params, queries and request bodies before use.
 */

import { z } from 'zod';

export const createEventCategorySchema = z.object({
  name:  z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const eventCategoryIdParamsSchema = z.object({
  id: z.string().uuid(),
});
