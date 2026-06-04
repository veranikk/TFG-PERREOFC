/**
 * Defines validation schemas for the players backend feature.
 * These schemas protect the API by checking params, queries and request bodies before use.
 */

import { z } from 'zod';

export const playerIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const getPlayerQuerySchema = z.object({
  seasonId: z.coerce.number().int().positive().optional(),
});




