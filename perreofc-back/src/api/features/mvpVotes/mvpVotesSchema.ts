/**
 * Defines validation schemas for the mvp votes backend feature.
 * These schemas protect the API by checking params, queries and request bodies before use.
 */

import { z } from 'zod';

export const castVoteSchema = z.object({
  matchId: z.coerce.number().int().positive(),
  playerId: z.coerce.number().int().positive(),
});

export const mvpMatchIdParamsSchema = z.object({
  matchId: z.coerce.number().int().positive(),
});

// YYYY-MM-DD
export const mvpDeadlineBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida, usa YYYY-MM-DD'),
});




