/**
 * Defines validation schemas for the matches backend feature.
 * These schemas protect the API by checking params, queries and request bodies before use.
 */

import { z } from 'zod';

export const getMatchesQuerySchema = z.object({
  status: z.enum(['upcoming', 'live', 'finished', 'suspended']).optional(),
  teamId: z.coerce.number().int().positive().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const matchIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});




