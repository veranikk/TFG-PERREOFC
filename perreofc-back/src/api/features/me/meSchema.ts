/**
 * Defines validation schemas for the me backend feature.
 * These schemas protect the API by checking params, queries and request bodies before use.
 */

import { z } from 'zod';
import { validatePassword } from '../../../shared/validators.js';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

// Usa la misma política de contraseñas que authController para consistencia
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1).superRefine((val, ctx) => {
    const err = validatePassword(val);
    if (err) ctx.addIssue({ code: z.ZodIssueCode.custom, message: err });
  }),
});

export const updateNotifPrefsSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  matchReminders: z.boolean().optional(),
  newsUpdates: z.boolean().optional(),
});




