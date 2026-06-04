/**
 * Provides shared backend infrastructure for env.
 * Utilities here are reused across features for configuration, clients, logging or validation.
 */


import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_KEY: z.string().min(1),
    API_PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    OWN_TEAM_ID: z.coerce.number().default(24141910),
    N8N_WEBHOOK_URL: z.string().url(),
    GMAIL_USER: z.string().email(),
    GMAIL_APP_PASSWORD: z.string().min(1),
    // URL del frontend — obligatoria en producción para restringir CORS
    FRONTEND_URL: z.preprocess(v => v === '' ? undefined : v, z.string().url().optional()),
});

export const env = envSchema.parse(process.env);