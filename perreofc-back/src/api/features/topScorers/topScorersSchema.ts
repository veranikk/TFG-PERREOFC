/**
 * Defines validation schemas for the top scorers backend feature.
 * These schemas protect the API by checking params, queries and request bodies before use.
 */

import { z } from 'zod';

export const getTopScorersQuerySchema = z.object({
    groupId: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).default(10),
});

export type GetTopScorersQuery = z.infer<typeof getTopScorersQuerySchema>;




