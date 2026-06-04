/**
 * Provides shared backend infrastructure for supabase.
 * Utilities here are reused across features for configuration, clients, logging or validation.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';
import type { Database } from './types/database.js';

let _adminClient: SupabaseClient<Database> | null = null;

/**
 * Cliente con service_role key. Bypassa RLS.
 * USAR SOLO en backend (API server-side).
 * NUNCA exponer al frontend.
 */
export function getAdminClient(): SupabaseClient<Database> {
  if (_adminClient) return _adminClient;

  _adminClient = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _adminClient;
}

// (Añade junto a getAdminClient)
let anonClient: ReturnType<typeof createClient> | null = null;

export function getAnonClient() {
  if (!anonClient) {
    anonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return anonClient;
}

