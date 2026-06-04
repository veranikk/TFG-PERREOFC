/**
 * Defines validation schemas for the classification backend feature.
 * These schemas protect the API by checking params, queries and request bodies before use.
 */

import { z } from 'zod';

export const getClassificationQuerySchema = z.object({
  groupId: z.coerce.number().int().positive().optional(),
  roundNumber: z.coerce.number().int().positive().optional(),
});

export type GetClassificationQuery = z.infer<typeof getClassificationQuerySchema>;




