/**
 * Shared scraper infrastructure for supabase.
 * This file centralizes configuration or Supabase clients used by scraping modules.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';
import type { Database } from './types/database.js';

let _adminClient: SupabaseClient<Database> | null = null;

/**
 * Cliente con service_role key. Bypassa RLS.
 * USAR SOLO en backend (scrapers).
 * NUNCA exponer al frontend.
 */
export function getAdminClient(): SupabaseClient<Database> {
  if (_adminClient) return _adminClient;

  _adminClient = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _adminClient;
}
