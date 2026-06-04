/**
 * Defines validation schemas for the points backend feature.
 * These schemas protect the API by checking params, queries and request bodies before use.
 */

import { z } from 'zod';

export const getPointsHistoryQuerySchema = z.object({
  action: z
    .enum(['register', 'daily_login', 'vote_mvp', 'bet', 'win_bet', 'adjustment'])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  since: z.string().datetime({ offset: true }).optional(),
});

export const updatePointsConfigSchema = z.object({
  register:   z.number().int().min(0).optional(),
  dailyLogin: z.number().int().min(0).optional(),
  voteMvp:    z.number().int().min(0).optional(),
  winBet:     z.number().int().min(0).optional(),
}).refine(
  (obj) => Object.keys(obj).length > 0,
  { message: 'Se requiere al menos un campo para actualizar' }
);





