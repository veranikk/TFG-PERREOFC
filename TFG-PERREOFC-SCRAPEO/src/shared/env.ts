/**
 * Shared scraper infrastructure for env.
 * This file centralizes configuration or Supabase clients used by scraping modules.
 */

import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  SCRAPER_PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  OWN_TEAM_ID: z.coerce.number().default(24141910),
  INTERNAL_TOKEN: z.string().min(1),
  // Orígenes permitidos para CORS, separados por coma.
  // Si se omite, se permite cualquier origen (útil en desarrollo).
  // Ejemplo producción: CORS_ORIGIN=https://perreofc.app,https://n8n.perreofc.app
  CORS_ORIGIN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
