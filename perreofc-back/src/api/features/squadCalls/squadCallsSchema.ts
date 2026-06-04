/**
 * Defines validation schemas for the squad calls backend feature.
 * These schemas protect the API by checking params, queries and request bodies before use.
 */

import { z } from 'zod';

export const matchIdParamsSchema = z.object({
  matchId: z.coerce.number().int().positive(),
});

const kitSlotSchema = z.enum(['titular', 'suplente']);

const squadCallPlayerSchema = z.object({
  playerId:   z.number().int().positive(),
  playerName: z.string().min(1).max(200),
});

export const upsertSquadCallSchema = z.object({
  reportTime:  z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  location:    z.string().max(300).nullable().optional(),
  kitSlot:     kitSlotSchema.optional().default('titular'),
  shirtColor:  z.string().max(50).nullable().optional(),
  shortsColor: z.string().max(50).nullable().optional(),
  socksColor:  z.string().max(50).nullable().optional(),
  players:     z.array(squadCallPlayerSchema).min(1).max(18),
});
