/**
 * Defines validation schemas for the teams backend feature.
 * These schemas protect the API by checking params, queries and request bodies before use.
 */

import { z } from 'zod';

export const teamIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const getSquadQuerySchema = z.object({
  seasonId: z.coerce.number().int().positive().optional(),
});




