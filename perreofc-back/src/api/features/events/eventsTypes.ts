/**
 * Defines shared TypeScript types for the events backend feature.
 * Keeping these contracts central helps controllers, services and docs stay aligned.
 */

import { Database } from '../../../shared/types/database.js';

export type MatchEvent = Database['public']['Tables']['events']['Row'];
export type MatchEventInsert = Database['public']['Tables']['events']['Insert'];




