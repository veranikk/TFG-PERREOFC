/**
 * Defines validation schemas for the users backend feature.
 * These schemas protect the API by checking params, queries and request bodies before use.
 */

import { z } from 'zod';

export const getUserStatsQuerySchema = z.object({
  userId: z.string().uuid(),
});

export const adminUpdateUserRoleSchema = z.object({
  role: z.enum(['aficionado', 'jugador', 'admin', 'superadmin']),
});

export const adminListUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: z.enum(['aficionado', 'jugador', 'admin', 'superadmin']).optional(),
  banned: z.enum(['true', 'false']).optional().transform((val) => val === undefined ? undefined : val === 'true'),
  search: z.string().min(1).max(100).optional(),
});

export const adminAdjustPointsSchema = z.object({
  delta: z.number().int().refine((n) => n !== 0, { message: 'delta no puede ser 0' }),
});

export const adminBanUserSchema = z.object({
  banned: z.boolean(),
  banReason: z.string().max(500).optional(),
});

export const adminCreateUserSchema = z.object({
  role: z.enum(['jugador', 'admin', 'superadmin']),
  email: z.string().email({ message: 'Email no válido' }),
  password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
  username: z.string().min(3).max(30).regex(/^\S+$/, { message: 'El username no puede contener espacios' }),
  firstName: z.string().min(1, { message: 'El nombre es obligatorio' }),
  lastName: z.string().min(1, { message: 'El apellido es obligatorio' }),
  playerId: z.number().int().positive().optional(),
});





