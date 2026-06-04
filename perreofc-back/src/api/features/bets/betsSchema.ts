/**
 * Defines validation schemas for the bets backend feature.
 * These schemas protect the API by checking params, queries and request bodies before use.
 */

import { z } from 'zod';

export const placeBetSchema = z.object({
  matchId: z.number().int().positive(),
  prediction: z.enum(['home', 'draw', 'away']),
  pointsWagered: z.number().int().positive(),
});

export const getMyBetsQuerySchema = z.object({
  result: z.enum(['pending', 'win', 'loss']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const settleBetsSchema = z.object({
  matchId: z.number().int().positive(),
});





