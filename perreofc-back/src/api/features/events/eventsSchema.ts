/**
 * Defines validation schemas for the events backend feature.
 * These schemas protect the API by checking params, queries and request bodies before use.
 */

import { z } from 'zod';

const eventTypeSchema = z.string().min(1).max(50);

export const getEventsQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: eventTypeSchema.optional(),
});

export const eventIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const recurrenceSchema = z.object({
  type:     z.enum(['weekly', 'monthly', 'custom']),
  interval: z.number().int().min(1),
  days:     z.array(z.number().int().min(0).max(6)).optional(), // 0=Dom … 6=Sáb
  endDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).optional();

export const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  type: eventTypeSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  location: z.string().nullable().optional(),
  matchId: z.number().int().positive().nullable().optional(),
  visibility: z.array(z.enum(['aficionado', 'jugador', 'admin', 'superadmin'])).min(1),
  recurrence: recurrenceSchema,
});

export const updateEventSchema = createEventSchema.partial();





