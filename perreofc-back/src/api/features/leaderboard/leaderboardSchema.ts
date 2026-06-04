/**
 * Defines validation schemas for the leaderboard backend feature.
 * These schemas protect the API by checking params, queries and request bodies before use.
 */

import { z } from 'zod';

export const getLeaderboardQuerySchema = z.object({
  period: z.enum(['total', 'monthly', 'weekly']).default('total'),
  limit: z.coerce.number().int().positive().max(100).default(50),
});




